# SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
"""
GovernedActionOrchestrator — Phase 15D trust boundary.

This class is the ONLY component in the Copilot subsystem that may import:
    ActionExecutor
    DecisionEngine
    ApprovalStore

CopilotService calls this orchestrator; it never holds these imports itself.
That invariant is validated by architecture tests in test_phase15d_act.py.

Governance flow:
    GovernedActionRequest
        ↓
    _build_proposal()       — deterministic capability → ActionProposal mapping
        ↓
    DecisionEngine.evaluate()
        ↓
    APPROVED            → executor.execute() → CONFIRMED / UNKNOWN
    REQUIRES_HUMAN_APPROVAL → ctrl.add_pending_approval()
    REJECTED            → surface violations
    REQUIRES_FRESH_STATE → surface staleness
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any

from .models import CopilotActResult, GovernedActionRequest, MutationState

logger = logging.getLogger(__name__)

_SAFETY_NO_MUTATION = "未对仓库做任何更改。"
_SAFETY_CONFIRMED   = "执行已确认。"
_SAFETY_UNKNOWN     = "执行状态不确定——需要对账。"

_WAVE_TASK_TYPES = frozenset({"PICK", "PACK", "SHIP", "RECEIVE", "PUTAWAY", "TRANSFER"})


class GovernedActionOrchestrator:
    """
    Owns the proposal → decision → approval / execution boundary.

    Responsibilities:
    - Accept a GovernedActionRequest from CopilotService
    - Build the canonical ActionProposal via existing skill/factory APIs
    - Invoke DecisionEngine.evaluate()
    - Route REQUIRES_HUMAN_APPROVAL to existing ApprovalStore/ctrl
    - Route APPROVED to the existing ActionExecutor
    - Return a CopilotActResult — never expose raw Decision/Approval objects to caller

    This class MUST NOT be imported by CopilotService itself. It is injected
    via CopilotService.set_orchestrator() to keep the import dependency graph clean.
    """

    def __init__(
        self,
        *,
        decision_engine: Any,
        demo_controller: Any,
        runtime: Any,
    ) -> None:
        self._engine = decision_engine
        self._ctrl = demo_controller
        self._runtime = runtime

    async def govern(
        self,
        *,
        request: GovernedActionRequest,
        snapshot: Any,
        warehouse_id: str,
    ) -> CopilotActResult:
        """
        Execute the full governance lifecycle for one GovernedActionRequest.

        Always returns a CopilotActResult — never raises. Errors are surfaced
        as decision_outcome="ERROR" with degraded=True.
        """
        _t0 = time.monotonic()
        trace_id = request.trace_id

        # ── 1. Build ActionProposal ───────────────────────────────────────────
        try:
            proposal = await self._build_proposal(request, trace_id, warehouse_id=warehouse_id)
        except ValueError as exc:
            logger.warning("GovernedActionOrchestrator: proposal build failed — %s", exc)
            return self._error_result(
                request=request,
                message=str(exc),
                latency_ms=(time.monotonic() - _t0) * 1000,
            )
        except Exception as exc:
            logger.error("GovernedActionOrchestrator: unexpected proposal error — %s", exc)
            return self._error_result(
                request=request,
                message=f"无法准备动作：{exc}",
                latency_ms=(time.monotonic() - _t0) * 1000,
            )

        # ── 2. DecisionEngine.evaluate() ─────────────────────────────────────
        try:
            from maiw_decision.models import DecisionOutcome, DecisionRequest

            decision_request = DecisionRequest(
                proposal=proposal,
                state=snapshot,
                requested_by="copilot-operator",
                trace_id=trace_id,
            )
            decision_result, _audit = self._engine.evaluate(decision_request)
            decision_result.trace_id = trace_id
        except Exception as exc:
            logger.error("GovernedActionOrchestrator: DecisionEngine failed — %s", exc)
            return self._error_result(
                request=request,
                message=f"策略评估失败：{exc}",
                proposal_id=getattr(proposal, "proposal_id", None),
                latency_ms=(time.monotonic() - _t0) * 1000,
            )

        outcome = decision_result.outcome
        violations = [v.model_dump() for v in decision_result.violations]

        # ── 3. Route by outcome ───────────────────────────────────────────────

        if outcome == DecisionOutcome.REJECTED:
            reason = violations[0]["message"] if violations else "策略约束被违反。"
            return CopilotActResult(
                message=(
                    f"MAIW 未授权此动作。\n\n"
                    f"决策：REJECTED\n\n原因：{reason}"
                ),
                recommendation_id=request.recommendation_id,
                capability=request.capability,
                target=request.target,
                decision_outcome="REJECTED",
                proposal_id=proposal.proposal_id,
                decision_id=decision_result.result_id,
                approval_required=False,
                pending_approval_id=None,
                execution_status=None,
                execution_id=None,
                mutation_state=MutationState.NOT_ATTEMPTED,
                safety_note=_SAFETY_NO_MUTATION,
                violations=violations,
                source_recommendation_id=request.recommendation_id,
                source_snapshot_id=request.source_snapshot_id,
                snapshot_id=request.current_snapshot_id,
                conversation_id=request.conversation_id,
                turn_id=request.turn_id,
                trace_id=trace_id,
                warehouse_id=warehouse_id,
                latency_ms=(time.monotonic() - _t0) * 1000,
            )

        if outcome == DecisionOutcome.REQUIRES_FRESH_STATE:
            return CopilotActResult(
                message=(
                    "无法基于当前快照准备该动作。"
                    "我需要最新的仓库状态才能继续。"
                ),
                recommendation_id=request.recommendation_id,
                capability=request.capability,
                target=request.target,
                decision_outcome="REQUIRES_FRESH_STATE",
                proposal_id=proposal.proposal_id,
                decision_id=decision_result.result_id,
                approval_required=False,
                pending_approval_id=None,
                execution_status=None,
                execution_id=None,
                mutation_state=MutationState.NOT_ATTEMPTED,
                safety_note=_SAFETY_NO_MUTATION,
                violations=violations,
                source_recommendation_id=request.recommendation_id,
                source_snapshot_id=request.source_snapshot_id,
                snapshot_id=request.current_snapshot_id,
                conversation_id=request.conversation_id,
                turn_id=request.turn_id,
                trace_id=trace_id,
                warehouse_id=warehouse_id,
                latency_ms=(time.monotonic() - _t0) * 1000,
            )

        if outcome == DecisionOutcome.REQUIRES_HUMAN_APPROVAL:
            risk_str = (
                proposal.risk_level.value
                if hasattr(proposal.risk_level, "value")
                else str(proposal.risk_level)
            )
            try:
                pending_id = self._ctrl.add_pending_approval(
                    proposal_id=proposal.proposal_id,
                    decision_id=decision_result.result_id,
                    trace_id=trace_id,
                    capability=request.capability,
                    target=request.target,
                    domain=request.domain,
                    priority=request.priority,
                    objective=request.objective,
                    rationale=request.rationale,
                    risk_level=risk_str,
                    warehouse_id=warehouse_id,
                    proposal_data=proposal.model_dump(mode="json"),
                )
            except Exception as exc:
                logger.error("GovernedActionOrchestrator: add_pending_approval failed — %s", exc)
                pending_id = None

            return CopilotActResult(
                message=(
                    f"我已将推荐的 {request.domain} 动作提交 MAIW 审批。\n\n"
                    f"动作\n{request.objective}\n\n"
                    "决策\n需要人工审批\n\n"
                    "尚未对仓库做任何更改。"
                ),
                recommendation_id=request.recommendation_id,
                capability=request.capability,
                target=request.target,
                decision_outcome="REQUIRES_HUMAN_APPROVAL",
                proposal_id=proposal.proposal_id,
                decision_id=decision_result.result_id,
                approval_required=True,
                pending_approval_id=pending_id,
                execution_status=None,
                execution_id=None,
                mutation_state=MutationState.NOT_ATTEMPTED,
                safety_note=_SAFETY_NO_MUTATION,
                violations=[],
                source_recommendation_id=request.recommendation_id,
                source_snapshot_id=request.source_snapshot_id,
                snapshot_id=request.current_snapshot_id,
                conversation_id=request.conversation_id,
                turn_id=request.turn_id,
                trace_id=trace_id,
                warehouse_id=warehouse_id,
                latency_ms=(time.monotonic() - _t0) * 1000,
            )

        if outcome == DecisionOutcome.APPROVED:
            executor = self._get_executor(request.domain)
            if executor is None:
                return CopilotActResult(
                    message=(
                        "动作已批准，但该域未配置执行器。"
                    ),
                    recommendation_id=request.recommendation_id,
                    capability=request.capability,
                    target=request.target,
                    decision_outcome="APPROVED",
                    proposal_id=proposal.proposal_id,
                    decision_id=decision_result.result_id,
                    approval_required=False,
                    pending_approval_id=None,
                    execution_status="NO_EXECUTOR",
                    execution_id=None,
                    mutation_state=MutationState.NOT_ATTEMPTED,
                    safety_note=_SAFETY_NO_MUTATION,
                    violations=[],
                    source_recommendation_id=request.recommendation_id,
                    source_snapshot_id=request.source_snapshot_id,
                    snapshot_id=request.current_snapshot_id,
                    conversation_id=request.conversation_id,
                    turn_id=request.turn_id,
                    trace_id=trace_id,
                    warehouse_id=warehouse_id,
                    latency_ms=(time.monotonic() - _t0) * 1000,
                )

            try:
                from maiw_execution.outcome import ExecutionOutcome as _EO
                from maiw_mcp.deadline import RequestDeadline as _RD

                exec_deadline = _RD.from_timeout(30.0)
                exec_result = await executor.execute(
                    proposal, decision_result,
                    trace_id=trace_id,
                    deadline=exec_deadline,
                )
                exec_result.trace_id = trace_id

                exec_outcome = exec_result.outcome
                exec_status = (
                    exec_outcome.value if hasattr(exec_outcome, "value") else str(exec_outcome)
                )

                if exec_outcome == _EO.EXECUTED:
                    mutation_state = MutationState.CONFIRMED
                    safety_note = _SAFETY_CONFIRMED
                elif exec_outcome == _EO.UNKNOWN:
                    mutation_state = MutationState.UNKNOWN
                    safety_note = _SAFETY_UNKNOWN
                elif exec_outcome == _EO.NO_OP:
                    mutation_state = MutationState.CONFIRMED
                    safety_note = "动作无实际效果——目标已处于期望状态。"
                else:
                    mutation_state = MutationState.NOT_ATTEMPTED
                    safety_note = _SAFETY_NO_MUTATION

                msg = _execution_message(exec_outcome, request.objective, _EO)

            except Exception as exc:
                logger.error("GovernedActionOrchestrator: execution failed — %s", exc)
                exec_status = "ERROR"
                exec_result = None
                mutation_state = MutationState.NOT_ATTEMPTED
                safety_note = _SAFETY_NO_MUTATION
                msg = f"动作已批准，但执行时发生错误：{exc}"

            return CopilotActResult(
                message=msg,
                recommendation_id=request.recommendation_id,
                capability=request.capability,
                target=request.target,
                decision_outcome="APPROVED",
                proposal_id=proposal.proposal_id,
                decision_id=decision_result.result_id,
                approval_required=False,
                pending_approval_id=None,
                execution_status=exec_status,
                execution_id=getattr(exec_result, "execution_id", None) if exec_result else None,
                mutation_state=mutation_state,
                safety_note=safety_note,
                violations=[],
                source_recommendation_id=request.recommendation_id,
                source_snapshot_id=request.source_snapshot_id,
                snapshot_id=request.current_snapshot_id,
                conversation_id=request.conversation_id,
                turn_id=request.turn_id,
                trace_id=trace_id,
                warehouse_id=warehouse_id,
                latency_ms=(time.monotonic() - _t0) * 1000,
            )

        # Fallback — unknown outcome
        return self._error_result(
            request=request,
            message=f"未预期的决策结果：{outcome}",
            proposal_id=proposal.proposal_id,
            latency_ms=(time.monotonic() - _t0) * 1000,
        )

    # ── Proposal building ─────────────────────────────────────────────────────

    async def _build_proposal(self, req: GovernedActionRequest, trace_id: str, *, warehouse_id: str = "default") -> Any:
        """
        Deterministic capability → ActionProposal mapping.

        Mirrors _build_proposal() from routers/demo.py but accepts
        GovernedActionRequest instead of a RecommendedAction, and uses
        "copilot-operator" as requested_by.
        """
        cap = req.capability

        if cap == "warehouse.equipment.assign":
            from maiw_skills.equipment.skills import (
                EquipmentAssignmentRequest,
                EquipmentAssignmentSkill,
            )

            skill = EquipmentAssignmentSkill()
            r = EquipmentAssignmentRequest(
                asset_id=req.target,
                assignee="copilot-operator",
                assignment_type=req.subtype or "task",
                reason=req.rationale,
                requested_by="copilot-operator",
            )
            return await skill.execute(r, trace_id=trace_id)

        if cap == "warehouse.equipment.release":
            from maiw_decision.proposal import ActionProposal

            return ActionProposal.for_equipment_release(
                asset_id=req.target,
                released_by="copilot-operator",
                reason=req.rationale,
                requested_by="copilot-operator",
                trace_id=trace_id,
            )

        if cap == "warehouse.equipment.schedule_maintenance":
            from maiw_decision.proposal import ActionProposal

            return ActionProposal.for_schedule_maintenance(
                asset_id=req.target,
                maintenance_type=req.subtype or "unscheduled",
                description=req.objective,
                scheduled_by="copilot-operator",
                priority=req.priority,
                reason=req.rationale,
                requested_by="copilot-operator",
                trace_id=trace_id,
            )

        if cap == "warehouse.labor.allocate":
            from maiw_skills.labor.skills import ProposeLaborAllocationSkill

            task_id, worker_ids = self._resolve_labor_target()
            skill = ProposeLaborAllocationSkill()
            return await skill.execute(
                task_id=task_id,
                task_type=req.subtype or "pick",
                worker_ids=worker_ids,
                priority=req.priority,
                reason=req.rationale,
                requested_by="copilot-operator",
                warehouse_id=warehouse_id,
                trace_id=trace_id,
            )

        if cap == "warehouse.wave.reprioritize":
            from maiw_skills.wave.skills import ProposeWaveReprioritizationSkill

            skill = ProposeWaveReprioritizationSkill()
            return await skill.execute(
                zone=(
                    req.target
                    if req.target.startswith("zone") or len(req.target) <= 3
                    else None
                ),
                wave_id=(
                    req.target
                    if not (req.target.startswith("zone") or len(req.target) <= 3)
                    else None
                ),
                new_priority=req.priority,
                reason=req.rationale,
                requested_by="copilot-operator",
                trace_id=trace_id,
            )

        raise ValueError(
            f"该推荐目前无法作为受控 MAIW 动作准备"
            f"（不支持的能力：{cap!r}）。"
        )

    def _resolve_labor_target(self) -> tuple[str, list[str]]:
        """
        Ground a labor allocation to concrete (task_id, [worker_id]) IDs.

        Mirrors _resolve_labor_allocation_target() from routers/demo.py.
        """
        world = getattr(self._ctrl, "world", None)
        if world is None:
            raise ValueError("CAPACITY_UNAVAILABLE：仓库世界不可用")

        pending = sorted(
            [
                t for t in world.tasks.values()
                if t.status == "pending" and t.task_type in _WAVE_TASK_TYPES
            ],
            key=lambda t: (
                0 if t.priority == "high" else 1 if t.priority == "medium" else 2,
                t.deadline or "9999",
                t.task_id,
            ),
        )
        available = [
            w for w in world.workers.values()
            if w.status == "active" and w.current_task_id is None
        ]

        if not pending:
            raise ValueError("CAPACITY_UNAVAILABLE：没有待分配的波次任务")
        if not available:
            raise ValueError(
                f"CAPACITY_UNAVAILABLE：没有空闲工人可用 "
                f"（{sum(1 for w in world.workers.values() if w.status == 'active')} "
                f"名活跃工人全部在岗）"
            )

        task = pending[0]
        same_zone = [w for w in available if w.zone == task.zone]
        worker = same_zone[0] if same_zone else available[0]
        return task.task_id, [worker.worker_id]

    def _get_executor(self, domain: str) -> Any:
        """Return the domain executor from the runtime, or None if not wired."""
        if self._runtime is None:
            return None
        if domain == "equipment":
            return getattr(self._runtime, "equipment_executor", None)
        if domain == "labor":
            return getattr(self._runtime, "labor_executor", None)
        if domain == "wave":
            return getattr(self._runtime, "wave_executor", None)
        return None

    def _error_result(
        self,
        *,
        request: GovernedActionRequest,
        message: str,
        proposal_id: str | None = None,
        latency_ms: float = 0.0,
    ) -> CopilotActResult:
        return CopilotActResult(
            message=message,
            recommendation_id=request.recommendation_id,
            capability=request.capability,
            target=request.target,
            decision_outcome="ERROR",
            proposal_id=proposal_id,
            decision_id=None,
            approval_required=False,
            pending_approval_id=None,
            execution_status=None,
            execution_id=None,
            mutation_state=MutationState.NOT_ATTEMPTED,
            safety_note=_SAFETY_NO_MUTATION,
            violations=[],
            source_recommendation_id=request.recommendation_id,
            source_snapshot_id=request.source_snapshot_id,
            snapshot_id=request.current_snapshot_id,
            conversation_id=request.conversation_id,
            turn_id=request.turn_id,
            trace_id=request.trace_id,
            warehouse_id="unknown",
            latency_ms=latency_ms,
            degraded=True,
            degradation_reason=message,
        )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _execution_message(outcome: Any, objective: str, _EO: Any) -> str:
    if outcome == _EO.EXECUTED:
        return f"执行已确认。\n\n动作已完成\n{objective}"
    if outcome == _EO.UNKNOWN:
        return (
            "执行结果不确定。\n\n"
            "后端可能已接受该动作，但未确认回执。\n\n"
            "已禁止自动重试。需要对账。"
        )
    if outcome == _EO.NO_OP:
        return f"动作无实际效果——目标已处于期望状态。\n\n{objective}"
    if outcome == _EO.CONFLICT:
        return f"动作无法执行——仓库状态冲突。\n\n{objective}"
    return f"执行完成，结果：{getattr(outcome, 'value', str(outcome))}"
