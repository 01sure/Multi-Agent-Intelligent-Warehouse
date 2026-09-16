/**
 * CopilotDrawer.tsx — Phase 15D Copilot ASK + ANALYZE + ACT panel.
 *
 * Right-side overlay drawer for operator questions, recommendations, and governed
 * action requests. ACT routes through GovernedActionOrchestrator — no inline
 * APPROVE/EXECUTE buttons here. Approval happens in the existing MAIW approval UI.
 *
 * Constraints:
 *   - No chain_of_thought / scratchpad / hidden_reasoning / reasoning_tokens
 *   - No inline APPROVE / EXECUTE / force-action buttons in this drawer
 *   - "No warehouse changes have been made." always visible before approval/execution
 *   - Severity comes from fact.severity ONLY — never re-derived from value text
 *   - skills_used is always [] for ASK/ANALYZE — not shown
 */

import React, { useState, useRef, useEffect, useCallback, KeyboardEvent, Dispatch, SetStateAction } from 'react';
import { Box, Typography } from '@mui/material';
import { demoAPI, CopilotTurnResponse, CopilotRecommendation } from '../../../services/demoAPI';
import TerminalTypewriter from './TerminalTypewriter';
import { TurnEntry, CopilotSystemCard } from '../../../hooks/useCopilotConversation';

// ── Color constants (MAIW dark terminal aesthetic) ─────────────────────────────

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#F85149',
  HIGH:     '#F85149',
  MEDIUM:   '#D29922',
  LOW:      '#3FB950',
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: '#F85149',
  HIGH:     '#F85149',
  MEDIUM:   '#D29922',
  LOW:      '#3FB950',
};

const DECISION_OUTCOME_COLOR: Record<string, string> = {
  REQUIRES_HUMAN_APPROVAL: '#D29922',
  APPROVED:                '#3FB950',
  REJECTED:                '#F85149',
  REQUIRES_FRESH_STATE:    '#D29922',
  STALE_STATE:             '#D29922',
  CLARIFICATION_REQUIRED:  '#58A6FF',
  NOT_IMPLEMENTED:         '#484F58',
  ERROR:                   '#F85149',
};

const MUTATION_STATE_COLOR: Record<string, string> = {
  NOT_ATTEMPTED: '#484F58',
  CONFIRMED:     '#3FB950',
  UNKNOWN:       '#D29922',
};

// ── Loading stage sequences ────────────────────────────────────────────────────

const LOADING_STAGES_ASK = [
  '读取仓库状态',
  '解析上下文',
  '推理中',
  '完成',
];

const LOADING_STAGES_ANALYZE = [
  '读取状态',
  '解析上下文',
  '分析中',
  '完成',
];

const LOADING_STAGES_ACT = [
  '解析建议',
  '读取当前状态',
  '校验中',
  '准备受治理的行动',
  '评估策略',
  '完成',
];

const LOADING_STAGES_OBSERVE = [
  '读取当前状态',
  '比较状态',
  '完成',
];

// ── Suggested prompts (shown after a turn completes) ──────────────────────────

const SUGGEST_AFTER_ASK     = ['我们该怎么做？'];
const SUGGEST_AFTER_ANALYZE = ['执行。'];
const SUGGEST_AFTER_ACT     = ['成功了吗？'];

// ── Props ─────────────────────────────────────────────────────────────────────

interface GraphFocusContextLocal {
  entityId: string;
  entityLabel: string | null;
  turnId: string;
  traceId: string;
  entityCount: number | null;
}

// Phase 17E: historical snapshot context passed to World view
export interface SnapshotContextLocal {
  turnId: string;
  traceId: string;
  entityLabel: string | null;
  contextSnapshotId: string;
}

interface CopilotDrawerProps {
  warehouseId: string;
  scenarioName: string;
  onClose: () => void;
  onReviewApproval?: (pendingApprovalId: string) => void;
  onViewOperationalContext?: (ctx: GraphFocusContextLocal) => void;
  onViewContextAtDecisionTime?: (ctx: SnapshotContextLocal) => void;  // Phase 17E
  // Lifted conversation state — owned by DemoShell so it survives drawer remount
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  turns: TurnEntry[];
  setTurns: Dispatch<SetStateAction<TurnEntry[]>>;
  conversationError: string | null;
  setConversationError: (e: string | null) => void;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface CopilotAnswerProps {
  turn: CopilotTurnResponse;
  onViewOperationalContext?: (ctx: GraphFocusContextLocal) => void;
  onViewContextAtDecisionTime?: (ctx: SnapshotContextLocal) => void;  // Phase 17E
}

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLOR[severity?.toUpperCase()] ?? '#484F58';
  return (
    <Box component="span" sx={{
      fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700,
      color, border: `1px solid ${color}44`, borderRadius: '3px',
      px: '4px', py: '1px', textTransform: 'uppercase', letterSpacing: '0.08em',
      flexShrink: 0,
    }}>
      {severity}
    </Box>
  );
}

function RecommendationCard({ rec, index }: { rec: CopilotRecommendation; index: number }) {
  const [open, setOpen] = useState(false);
  const priColor = PRIORITY_COLOR[rec.priority?.toUpperCase()] ?? '#484F58';

  return (
    <Box sx={{
      background: '#161B22',
      border: '1px solid #21262D',
      borderLeft: `3px solid ${priColor}88`,
      borderRadius: '4px',
      p: '10px',
    }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '6px' }}>
        <Typography sx={{
          fontFamily: 'monospace', fontSize: '0.58rem', color: '#484F58',
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          建议 {index + 1}
        </Typography>
        <Box component="span" sx={{
          fontFamily: 'monospace', fontSize: '0.58rem', fontWeight: 700,
          color: priColor, border: `1px solid ${priColor}44`, borderRadius: '3px',
          px: '4px', py: '1px', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {rec.priority}
        </Box>
      </Box>

      {/* Objective */}
      <Typography sx={{
        fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 600,
        color: '#C9D1D9', lineHeight: 1.4, mb: '6px',
      }}>
        {rec.objective}
      </Typography>

      {/* Why */}
      <Typography sx={{
        fontFamily: 'monospace', fontSize: '0.68rem', color: '#8B949E',
        lineHeight: 1.5, mb: '6px',
      }}>
        {rec.rationale}
      </Typography>

      {/* Capability row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: '3px' }}>
        <Typography sx={{
          fontFamily: 'monospace', fontSize: '0.55rem', color: '#484F58',
          textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: '68px', flexShrink: 0,
        }}>
          能力
        </Typography>
        <Box component="span" sx={{
          fontFamily: 'monospace', fontSize: '0.6rem', color: '#58A6FF',
          border: '1px solid #1F6FEB33', borderRadius: '3px',
          px: '4px', py: '1px', wordBreak: 'break-all',
        }}>
          {rec.capability}
        </Box>
      </Box>
      {/* Target row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: '4px' }}>
        <Typography sx={{
          fontFamily: 'monospace', fontSize: '0.55rem', color: '#484F58',
          textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: '68px', flexShrink: 0,
        }}>
          目标
        </Typography>
        <Box component="span" sx={{
          fontFamily: 'monospace', fontSize: '0.6rem', color: '#3FB950',
          border: '1px solid #3FB95033', borderRadius: '3px',
          px: '4px', py: '1px',
        }}>
          {rec.target}
        </Box>
      </Box>

      {/* Expert details toggle */}
      <Box
        component="button"
        onClick={() => setOpen(o => !o)}
        sx={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'monospace', fontSize: '0.58rem', color: '#30363D',
          p: 0, mt: '4px',
          '&:hover': { color: '#484F58' },
        }}
      >
        来源 {open ? '▾' : '▸'}
      </Box>
      {open && (
        <Box sx={{ mt: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[
            ['快照',   rec.snapshot_id?.slice(0, 8)],
            ['追踪',      rec.trace_id?.slice(0, 8)],
            ['焦点',      rec.focus_entity_id],
            ['领域',     rec.domain],
            ['ID',         rec.recommendation_id],
          ].map(([label, val]) => val && (
            <Box key={String(label)} sx={{ display: 'flex', gap: '6px' }}>
              <Typography sx={{
                fontFamily: 'monospace', fontSize: '0.58rem', color: '#30363D',
                minWidth: '58px', flexShrink: 0,
              }}>
                {label}
              </Typography>
              <Typography sx={{
                fontFamily: 'monospace', fontSize: '0.58rem', color: '#484F58',
                wordBreak: 'break-all',
              }}>
                {String(val)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function CopilotActAnswer({ turn, isLatest, onReviewApproval }: CopilotAnswerProps & { isLatest?: boolean; onReviewApproval?: (pendingApprovalId: string) => void }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const outcome   = turn.act_decision_outcome ?? 'NOT_IMPLEMENTED';
  const mutState  = turn.act_mutation_state   ?? 'NOT_ATTEMPTED';
  const outColor  = DECISION_OUTCOME_COLOR[outcome]  ?? '#484F58';
  const mutColor  = MUTATION_STATE_COLOR[mutState]   ?? '#484F58';
  const safetyNote = turn.safety_note ?? '未对仓库做任何更改。';
  const confirmed = mutState === 'CONFIRMED';

  // Governance badges render IMMEDIATELY — never delayed by typewriter
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* ── AI REQUEST section ────────────────────────────────────────────── */}
      <Box sx={{
        background: '#0D1117',
        border: '1px solid #21262D',
        borderRadius: '4px',
        p: '10px',
        display: 'flex', flexDirection: 'column', gap: '6px',
      }}>
        <Typography sx={{
          fontFamily: 'monospace', fontSize: '0.52rem', fontWeight: 700,
          color: '#484F58', letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          AI 请求
        </Typography>
        {turn.answer ? (
          isLatest ? (
            <TerminalTypewriter
              text={turn.answer}
              turnKey={turn.turn_id}
              sx={{ fontSize: '0.78rem', color: '#C9D1D9', lineHeight: 1.5 }}
            />
          ) : (
            <Typography sx={{
              fontFamily: 'monospace', fontSize: '0.78rem', color: '#C9D1D9', lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}>
              {turn.answer}
            </Typography>
          )
        ) : null}
      </Box>

      {/* ── Arrow ─────────────────────────────────────────────────────────── */}
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#30363D', textAlign: 'center' }}>
        ↓
      </Typography>

      {/* ── DECISION ENGINE section ───────────────────────────────────────── */}
      <Box sx={{
        background: '#0D1117',
        border: `1px solid ${outColor}44`,
        borderRadius: '4px',
        p: '10px',
        display: 'flex', flexDirection: 'column', gap: '6px',
      }}>
        <Typography sx={{
          fontFamily: 'monospace', fontSize: '0.52rem', fontWeight: 700,
          color: '#484F58', letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          决策引擎
        </Typography>
        <Box component="span" data-testid="copilot-act-decision-outcome" sx={{
          fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700,
          color: outColor, letterSpacing: '0.08em', textTransform: 'uppercase',
          display: 'inline-block',
        }}>
          {outcome.replace(/_/g, ' ')}
        </Box>
        {turn.act_violations && turn.act_violations.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', mt: '2px' }}>
            {turn.act_violations.map((v, i) => (
              <Typography key={i} sx={{
                fontFamily: 'monospace', fontSize: '0.65rem', color: '#F85149', lineHeight: 1.4,
              }}>
                ✗ [{v.code}] {v.message}
              </Typography>
            ))}
          </Box>
        )}
      </Box>

      {/* ── Arrow ─────────────────────────────────────────────────────────── */}
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#30363D', textAlign: 'center' }}>
        ↓
      </Typography>

      {/* ── EXECUTION section ─────────────────────────────────────────────── */}
      <Box sx={{
        background: '#0D1117',
        border: `1px solid ${mutColor}22`,
        borderRadius: '4px',
        p: '10px',
        display: 'flex', flexDirection: 'column', gap: '6px',
      }}>
        <Typography sx={{
          fontFamily: 'monospace', fontSize: '0.52rem', fontWeight: 700,
          color: '#484F58', letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          执行
        </Typography>
        <Box component="span" data-testid="copilot-act-mutation-state" sx={{
          fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700,
          color: mutColor, letterSpacing: '0.08em', textTransform: 'uppercase',
          display: 'inline-block',
        }}>
          {mutState.replace(/_/g, ' ')}
        </Box>

        {/* Safety note — always visible */}
        <Box
          data-testid="copilot-act-safety-note"
          sx={{
            background: confirmed ? '#0D1B0D' : '#1A1200',
            border: `1px solid ${confirmed ? '#3FB95044' : '#D2992244'}`,
            borderRadius: '3px',
            px: '8px', py: '5px',
            mt: '2px',
          }}
        >
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.68rem',
            color: confirmed ? '#3FB950' : '#D29922',
          }}>
            {confirmed ? '✓' : '⏳'} {safetyNote}
          </Typography>
        </Box>
      </Box>

      {/* ── Pending approval — no inline APPROVE button ───────────────────── */}
      {outcome === 'REQUIRES_HUMAN_APPROVAL' && turn.act_pending_approval_id && (
        <Box sx={{
          background: '#0D1117',
          border: '1px solid #D2992244',
          borderRadius: '4px',
          px: '10px', py: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.65rem', color: '#8B949E',
          }}>
            Pending: {turn.act_pending_approval_id.slice(0, 12)}…
          </Typography>
          <Box
            component="button"
            data-testid="copilot-act-review-approval"
            onClick={() => onReviewApproval?.(turn.act_pending_approval_id!)}
            sx={{
              background: 'transparent',
              border: '1px solid #D2992244',
              borderRadius: '3px',
              px: '8px', py: '3px',
              fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700,
              color: '#D29922', cursor: 'pointer', flexShrink: 0,
              letterSpacing: '0.08em',
              '&:hover': { color: '#F0A400', borderColor: '#F0A40044' },
            }}
          >
            审批复核
          </Box>
        </Box>
      )}

      {/* ── Governance details (collapsible) ─────────────────────────────── */}
      <Box>
        <Box
          component="button"
          onClick={() => setDetailsOpen(o => !o)}
          sx={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'monospace', fontSize: '0.58rem', color: '#30363D',
            p: 0, textAlign: 'left',
            '&:hover': { color: '#484F58' },
          }}
        >
          GOVERNANCE {detailsOpen ? '▾' : '▸'}
        </Box>
        {detailsOpen && (
          <Box sx={{
            mt: '4px', display: 'flex', flexDirection: 'column', gap: '3px',
            background: '#161B22', border: '1px solid #21262D',
            borderRadius: '4px', p: '8px',
          }}>
            {([
              ['提案 ID',   turn.act_proposal_id?.slice(0, 12)],
              ['决策 ID',   turn.act_decision_id?.slice(0, 12)],
              ['待处理 ID',    turn.act_pending_approval_id?.slice(0, 12)],
              ['执行 ID',  turn.act_execution_id?.slice(0, 12)],
              ['执行状态',   turn.act_execution_status],
              ['Snapshot S1',   turn.act_source_snapshot_id?.slice(0, 8)],
              ['延迟',       turn.latency_ms != null ? `${Math.round(turn.latency_ms)}ms` : null],
            ] as [string, string | null | undefined][]).map(([label, val]) => val != null && (
              <Box key={label} sx={{ display: 'flex', gap: '8px' }}>
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: '0.6rem', color: '#484F58',
                  minWidth: '80px', flexShrink: 0,
                }}>
                  {label}
                </Typography>
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: '0.6rem', color: '#8B949E',
                  wordBreak: 'break-word',
                }}>
                  {String(val)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Typography sx={{
        fontFamily: 'monospace', fontSize: '0.52rem', color: '#30363D',
        wordBreak: 'break-all',
      }}>
        追踪: {turn.trace_id}
      </Typography>
    </Box>
  );
}

// ── OBSERVE_OUTCOME answer ─────────────────────────────────────────────────────

function CopilotObserveAnswer({ turn, isLatest }: CopilotAnswerProps & { isLatest?: boolean }) {
  const improved = turn.observe_operational_improved ?? false;
  const improvedColor = improved ? '#3FB950' : '#D29922';
  const executionConfirmed = turn.observe_execution_confirmed ?? false;
  const decisionOutcome = turn.observe_act_decision_outcome ?? null;
  const pre = turn.observe_pre_metrics ?? {};
  const post = turn.observe_post_metrics ?? {};
  const delta = turn.observe_kpi_delta ?? {};
  const hasDelta = Object.keys(delta).length > 0;

  const metricRows: Array<[string, string | number | null, string | number | null, number | null]> = [
    ['待处理积压', pre.pending_tasks  ?? null, post.pending_tasks  ?? null, typeof delta.pending_tasks === 'number' ? delta.pending_tasks : null],
    ['风险任务',   pre.at_risk_tasks  ?? null, post.at_risk_tasks  ?? null, typeof delta.at_risk_tasks === 'number' ? delta.at_risk_tasks : null],
    ['空闲人力',    pre.idle_workers   ?? null, post.idle_workers   ?? null, typeof delta.idle_workers === 'number' ? delta.idle_workers : null],
    ['波次风险等级', pre.wave_risk_level ?? null, post.wave_risk_level ?? null, null],
  ].filter(([, pre]) => pre !== null) as Array<[string, string | number | null, string | number | null, number | null]>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Section header */}
      <Typography sx={{
        fontFamily: 'monospace', fontSize: '0.52rem', fontWeight: 700,
        color: '#484F58', letterSpacing: '0.14em', textTransform: 'uppercase',
      }}>
        观察到的结果
      </Typography>

      {/* Outcome badge */}
      {turn.observe_operational_summary && (
        <Box component="span" sx={{
          fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700,
          color: improvedColor, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {improved ? '✓ ' : '⚠ '}{turn.observe_operational_summary}
        </Box>
      )}

      {/* Narrative */}
      {turn.answer && (
        isLatest ? (
          <TerminalTypewriter
            text={turn.answer}
            turnKey={turn.turn_id}
            sx={{ fontSize: '0.78rem', color: '#C9D1D9', lineHeight: 1.5 }}
          />
        ) : (
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.78rem', color: '#C9D1D9', lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          }}>
            {turn.answer}
          </Typography>
        )
      )}

      {/* KPI delta table */}
      {hasDelta && metricRows.length > 0 && (
        <Box sx={{
          background: '#0D1117',
          border: '1px solid #21262D',
          borderRadius: '4px',
          p: '10px',
        }}>
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.52rem', fontWeight: 700,
            color: '#484F58', letterSpacing: '0.12em', textTransform: 'uppercase', mb: '8px',
          }}>
            状态差值
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {metricRows.map(([label, preval, postval, d]) => {
              const dColor = d != null ? (d < 0 ? '#3FB950' : d > 0 ? '#F85149' : '#484F58') : '#484F58';
              return (
                <Box key={label} sx={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                  <Typography sx={{
                    fontFamily: 'monospace', fontSize: '0.62rem', color: '#8B949E',
                    minWidth: '90px', flexShrink: 0,
                  }}>
                    {label}
                  </Typography>
                  <Typography sx={{
                    fontFamily: 'monospace', fontSize: '0.68rem', color: '#C9D1D9',
                  }}>
                    {String(preval)} → {String(postval)}
                  </Typography>
                  {d != null && d !== 0 && (
                    <Typography sx={{
                      fontFamily: 'monospace', fontSize: '0.6rem', color: dColor,
                      ml: 'auto', flexShrink: 0,
                    }}>
                      {d > 0 ? '+' : ''}{d}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Execution / safety note — adapts to actual outcome */}
      {executionConfirmed ? (
        <Box sx={{
          background: improved ? '#0D1B0D' : '#0D1117',
          border: `1px solid ${improved ? '#3FB95044' : '#D2992244'}`,
          borderRadius: '3px',
          px: '8px', py: '5px',
        }}>
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.68rem',
            color: improved ? '#3FB950' : '#D29922',
          }}>
            {improved
              ? '✓ 仓库状态已改变 — 受治理的行动已执行并确认'
              : '⚠ 执行已确认 — 尚无明显的 KPI 变化'}
          </Typography>
        </Box>
      ) : decisionOutcome === 'REJECTED' ? (
        <Box sx={{
          background: '#0D1117', border: '1px solid #30363D',
          borderRadius: '3px', px: '8px', py: '5px',
        }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#6E7681' }}>
            未改变仓库 — 行动在执行前已被拒绝
          </Typography>
        </Box>
      ) : decisionOutcome === 'REQUIRES_HUMAN_APPROVAL' && !improved ? (
        <Box sx={{
          background: '#1A1200', border: '1px solid #D2992244',
          borderRadius: '3px', px: '8px', py: '5px',
        }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#D29922' }}>
            ⚠ 尚未改变仓库 — 等待人工审批
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          background: '#0D1B0D', border: '1px solid #3FB95044',
          borderRadius: '3px', px: '8px', py: '5px',
        }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#3FB950' }}>
            ✓ {turn.safety_note ?? '未对仓库做任何更改。'}
          </Typography>
        </Box>
      )}

      <Typography sx={{
        fontFamily: 'monospace', fontSize: '0.52rem', color: '#30363D',
        wordBreak: 'break-all',
      }}>
        追踪: {turn.trace_id}
      </Typography>
    </Box>
  );
}

function CopilotAnswer({ turn, isLatest, onViewOperationalContext, onViewContextAtDecisionTime }: CopilotAnswerProps & { isLatest?: boolean; onViewOperationalContext?: (ctx: GraphFocusContextLocal) => void; onViewContextAtDecisionTime?: (ctx: SnapshotContextLocal) => void }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isAnalyze = turn.intent === 'analyze';
  const isInsufficient = turn.answerability === 'insufficient_evidence';
  const isPartial = turn.answerability === 'partial';
  const hasEvidence = turn.evidence && turn.evidence.length > 0 && !isInsufficient;
  const hasRecs = isAnalyze && turn.recommendations && turn.recommendations.length > 0;

  const answerLabel = isAnalyze ? '分析' : '回答';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* ── A. ANSWER / ANALYSIS section ──────────────────────────────────── */}
      <Box>
        <Typography sx={{
          fontFamily: 'monospace', fontSize: '0.58rem', fontWeight: 700,
          color: '#484F58', letterSpacing: '0.12em', textTransform: 'uppercase',
          mb: '4px',
        }}>
          {answerLabel}
        </Typography>

        {isInsufficient ? (
          <Box>
            <Typography sx={{
              fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700,
              color: '#D29922', letterSpacing: '0.06em', mb: '4px',
            }}>
              状态不可用
            </Typography>
            <Typography sx={{
              fontFamily: 'monospace', fontSize: '0.75rem', color: '#D29922', lineHeight: 1.5,
            }}>
              {turn.degradation_reason ?? '无法组装仓库状态。'}
            </Typography>
          </Box>
        ) : (
          <Box>
            {isPartial && turn.missing_context.length > 0 && (
              <Typography sx={{
                fontFamily: 'monospace', fontSize: '0.7rem', color: '#D29922',
                mb: '4px', lineHeight: 1.4,
              }}>
                ⚠ 部分结果 — 缺失：{turn.missing_context.join(', ')}
              </Typography>
            )}
            {/* severity badge for ANALYZE */}
            {isAnalyze && turn.severity && (
              <Box sx={{ mb: '6px' }}>
                <SeverityBadge severity={turn.severity} />
              </Box>
            )}
            {turn.answer && (
              isLatest ? (
                <TerminalTypewriter
                  text={turn.answer}
                  turnKey={turn.turn_id}
                  sx={{ fontSize: '0.8rem', color: '#C9D1D9', lineHeight: 1.5 }}
                />
              ) : (
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: '0.8rem', color: '#C9D1D9', lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}>
                  {turn.answer}
                </Typography>
              )
            )}
          </Box>
        )}
      </Box>

      {/* ── B. Evidence cards ─────────────────────────────────────────────── */}
      {hasEvidence && (
        <Box>
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.58rem', fontWeight: 700,
            color: '#484F58', letterSpacing: '0.12em', textTransform: 'uppercase',
            mb: '6px',
          }}>
            证据
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {turn.evidence!.map((fact, idx) => (
              <Box key={idx} sx={{
                background: '#161B22',
                border: '1px solid #21262D',
                borderRadius: '4px',
                p: '8px',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '4px' }}>
                  <Typography sx={{
                    fontFamily: 'monospace', fontSize: '0.65rem', color: '#8B949E',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {fact.label}
                  </Typography>
                  {fact.severity && <SeverityBadge severity={fact.severity} />}
                </Box>
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: '0.75rem', color: '#C9D1D9',
                  lineHeight: 1.4, mb: '4px',
                }}>
                  {fact.value}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Box component="span" sx={{
                    fontFamily: 'monospace', fontSize: '0.58rem', color: '#3FB950',
                    border: '1px solid #3FB95044', borderRadius: '3px',
                    px: '4px', py: '1px', letterSpacing: '0.06em',
                  }}>
                    状态
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* ── C. Recommendation cards (ANALYZE only) ────────────────────────── */}
      {hasRecs && (
        <Box>
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.58rem', fontWeight: 700,
            color: '#484F58', letterSpacing: '0.12em', textTransform: 'uppercase',
            mb: '6px',
          }}>
            建议行动
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {turn.recommendations!.map((rec, i) => (
              <RecommendationCard key={rec.recommendation_id} rec={rec} index={i} />
            ))}
          </Box>
        </Box>
      )}

      {/* ── D. Safety note (ANALYZE only) ─────────────────────────────────── */}
      {isAnalyze && !isInsufficient && (
        <Box sx={{
          background: '#0D1B0D',
          border: '1px solid #3FB95044',
          borderRadius: '4px',
          px: '10px', py: '7px',
        }}>
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.7rem', color: '#3FB950',
          }}>
            ✓ {turn.safety_note ?? '未对仓库做任何更改。'}
          </Typography>
        </Box>
      )}

      {/* ── E. Graph neighborhood status ──────────────────────────────────── */}
      {turn.neighborhood && (
        <Box>
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.58rem', fontWeight: 700,
            color: '#484F58', letterSpacing: '0.12em', textTransform: 'uppercase',
            mb: '4px',
          }}>
            上下文
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <Typography sx={{
              fontFamily: 'monospace', fontSize: '0.7rem', color: '#8B949E',
            }}>
              {turn.focus_entity_label ?? turn.neighborhood.focus_entity_label ?? '无实体焦点'} · {turn.neighborhood.entity_count} 个实体
            </Typography>
            <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {/* Phase 17E: VIEW CONTEXT AT DECISION TIME — historical snapshot */}
              {turn.context_snapshot_id && onViewContextAtDecisionTime && (
                <Box
                  component="button"
                  data-testid="view-context-at-decision-time"
                  onClick={() => onViewContextAtDecisionTime({
                    turnId: turn.turn_id,
                    traceId: turn.trace_id,
                    entityLabel: turn.focus_entity_label ?? null,
                    contextSnapshotId: turn.context_snapshot_id!,
                  })}
                  sx={{
                    background: 'transparent', border: '1px solid #1F6FEB44',
                    borderRadius: '3px', px: '6px', py: '2px', flexShrink: 0,
                    fontFamily: 'monospace', fontSize: '0.58rem',
                    color: '#58A6FF', cursor: 'pointer', fontWeight: 600,
                    '&:hover': { background: '#0D1420', borderColor: '#58A6FF' },
                  }}
                >
                  在决策时查看上下文
                </Box>
              )}
              {/* Existing: VIEW OPERATIONAL CONTEXT — current reconstruction */}
              {turn.focus_entity_id && turn.neighborhood.graph_available && onViewOperationalContext && (
                <Box
                  component="button"
                  data-testid="view-operational-context"
                  onClick={() => onViewOperationalContext({
                    entityId: turn.focus_entity_id!,
                    entityLabel: turn.focus_entity_label ?? null,
                    turnId: turn.turn_id,
                    traceId: turn.trace_id,
                    entityCount: turn.neighborhood?.entity_count ?? null,
                  })}
                  sx={{
                    background: 'transparent', border: '1px solid #21262D',
                    borderRadius: '3px', px: '6px', py: '2px', flexShrink: 0,
                    fontFamily: 'monospace', fontSize: '0.58rem',
                    color: '#484F58', cursor: 'pointer',
                    '&:hover': { background: '#0F1923', color: '#8B949E', borderColor: '#484F58' },
                  }}
                >
                  查看运营上下文
                </Box>
              )}
            </Box>
          </Box>
          {!turn.neighborhood.graph_available && (
            <Typography sx={{
              fontFamily: 'monospace', fontSize: '0.7rem', color: '#D29922', mt: '3px',
            }}>
              ⚠ 运营图上下文不可用
            </Typography>
          )}
        </Box>
      )}

      {/* ── E2. VIEW CONTEXT AT DECISION TIME (standalone — shown even without neighborhood) */}
      {turn.context_snapshot_id && onViewContextAtDecisionTime && !turn.neighborhood && (
        <Box
          component="button"
          data-testid="view-context-at-decision-time"
          onClick={() => onViewContextAtDecisionTime({
            turnId: turn.turn_id,
            traceId: turn.trace_id,
            entityLabel: turn.focus_entity_label ?? null,
            contextSnapshotId: turn.context_snapshot_id!,
          })}
          sx={{
            background: 'transparent', border: '1px solid #1F6FEB44',
            borderRadius: '3px', px: '6px', py: '2px',
            fontFamily: 'monospace', fontSize: '0.58rem',
            color: '#58A6FF', cursor: 'pointer', fontWeight: 600,
            '&:hover': { background: '#0D1420', borderColor: '#58A6FF' },
          }}
        >
          在决策时查看上下文
        </Box>
      )}

      {/* ── F. Degraded banner ────────────────────────────────────────────── */}
      {turn.degraded && !isInsufficient && (
        <Box sx={{
          background: '#1A1200',
          border: '1px solid #D2992244',
          borderRadius: '4px',
          px: '8px', py: '5px',
        }}>
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.68rem', color: '#D29922',
          }}>
            ⚠ 降级：{turn.degradation_reason}
          </Typography>
        </Box>
      )}

      {/* ── G. Details panel (collapsible) ────────────────────────────────── */}
      <Box>
        <Box
          component="button"
          onClick={() => setDetailsOpen(o => !o)}
          sx={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'monospace', fontSize: '0.62rem', color: '#484F58',
            p: 0, textAlign: 'left',
            '&:hover': { color: '#8B949E' },
          }}
        >
          详情 {detailsOpen ? '▾' : '▸'}
        </Box>
        {detailsOpen && (
          <Box sx={{
            mt: '4px', display: 'flex', flexDirection: 'column', gap: '3px',
            background: '#161B22', border: '1px solid #21262D',
            borderRadius: '4px', p: '8px',
          }}>
            {([
              ['智能体',        turn.agent],
              ['模型',        turn.model_id],
              ['推理',    turn.reasoning_level],
              ['路由',      turn.routing_rule],
              ['首选',    turn.requested_role],
              ['选定',     turn.selected_role],
              ['理由',       turn.routing_reason],
              ['回退',     turn.fallback_from ? `${turn.fallback_from} → ${turn.selected_role}` : null],
              ['回退原因', turn.fallback_reason],
              ['延迟',      turn.latency_ms != null ? `${turn.latency_ms}ms` : null],
            ] as [string, string | null | undefined][]).map(([label, val]) => val != null && (
              <Box key={label} sx={{ display: 'flex', gap: '8px' }}>
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: '0.62rem', color: '#484F58',
                  minWidth: '70px', flexShrink: 0,
                }}>
                  {label}
                </Typography>
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: '0.62rem', color: '#8B949E',
                  wordBreak: 'break-word',
                }}>
                  {String(val)}
                </Typography>
              </Box>
            ))}
            {turn.skills_available && turn.skills_available.length > 0 && (
              <Box sx={{ display: 'flex', gap: '8px' }}>
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: '0.62rem', color: '#484F58',
                  minWidth: '70px', flexShrink: 0,
                }}>
                  技能
                </Typography>
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: '0.62rem', color: '#8B949E',
                  wordBreak: 'break-word',
                }}>
                  {turn.skills_available.join(', ')}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* ── H. Trace link ─────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: '2px' }}>
        <Typography sx={{
          fontFamily: 'monospace', fontSize: '0.55rem', color: '#484F58',
          wordBreak: 'break-all', flexGrow: 1, mr: 1,
        }}>
          追踪: {turn.trace_id}
        </Typography>
        <Box
          component="button"
          data-testid="copilot-view-trace"
          onClick={() => console.log('[Copilot] View trace:', turn.trace_id, turn)}
          sx={{
            background: 'transparent',
            border: '1px solid #21262D',
            borderRadius: '3px',
            px: '6px', py: '2px',
            fontFamily: 'monospace', fontSize: '0.58rem',
            color: '#484F58', cursor: 'pointer', flexShrink: 0,
            '&:hover': { color: '#58A6FF', borderColor: '#58A6FF44' },
          }}
        >
          查看追踪
        </Box>
      </Box>

    </Box>
  );
}

// Export for direct testing of the rendering logic
export { CopilotAnswer, CopilotActAnswer, CopilotObserveAnswer };

// ── CopilotDrawer ─────────────────────────────────────────────────────────────

export default function CopilotDrawer({
  warehouseId,
  scenarioName,
  onClose,
  onReviewApproval,
  onViewOperationalContext,
  onViewContextAtDecisionTime,
  conversationId,
  setConversationId,
  turns,
  setTurns,
  conversationError,
  setConversationError,
}: CopilotDrawerProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStageIdx, setLoadingStageIdx] = useState(0);
  const [pendingIntent, setPendingIntent] = useState<'ask' | 'analyze' | 'act' | 'observe'>('ask');

  const threadRef = useRef<HTMLDivElement>(null);
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeStages =
    pendingIntent === 'act'     ? LOADING_STAGES_ACT :
    pendingIntent === 'analyze' ? LOADING_STAGES_ANALYZE :
    pendingIntent === 'observe' ? LOADING_STAGES_OBSERVE :
    LOADING_STAGES_ASK;

  // Cycle loading stage label while loading
  useEffect(() => {
    if (loading) {
      setLoadingStageIdx(0);
      stageTimerRef.current = setInterval(() => {
        setLoadingStageIdx(i => (i + 1) % (activeStages.length - 1));
      }, 800);
    } else {
      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current);
        stageTimerRef.current = null;
      }
      setLoadingStageIdx(activeStages.length - 1);
    }
    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    };
  }, [loading, activeStages.length]);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [turns, loading]);

  const handleSend = useCallback(async (msg?: string) => {
    const text = (msg ?? inputMessage).trim();
    if (!text || loading) return;

    // Detect intended intent client-side for loading stage label
    const looksLikeObserve = /\b(did it work|did that work|what happened|any improvement|outcome|did it help)\b/i.test(text);
    const looksLikeAct     = /\b(do it|proceed|execute|apply|allocate the|reprioritize|prepare (that|this|the) action|do (the )?(first|second|third|1st|2nd|#?1|#?2|one|that))\b/i.test(text);
    const looksLikeAnalyze = /\b(recommend|what should (we|i|you)|how should (we|i|you)|best action|what actions?)\b/i.test(text);
    setPendingIntent(looksLikeObserve ? 'observe' : looksLikeAct ? 'act' : looksLikeAnalyze ? 'analyze' : 'ask');

    const turnId = `turn-${Date.now()}`;
    setInputMessage('');
    setConversationError(null);
    setLoading(true);

    setTurns(prev => [...prev, { id: turnId, question: text, response: null, error: null }]);

    try {
      const resp = await demoAPI.copilotAsk({
        message: text,
        conversation_id: conversationId,
        warehouse_id: warehouseId,
        scenario_name: scenarioName,
      });

      if (!conversationId) setConversationId(resp.conversation_id);

      setTurns(prev => prev.map(t =>
        t.id === turnId ? { ...t, response: resp } : t
      ));
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail ?? err?.message ?? '请求失败';
      setTurns(prev => prev.map(t =>
        t.id === turnId ? { ...t, error: String(errMsg) } : t
      ));
      setConversationError(String(errMsg));
    } finally {
      setLoading(false);
    }
  }, [inputMessage, loading, conversationId, warehouseId, scenarioName]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Determine if last completed turn was ASK / ANALYZE / ACT (for suggested prompts).
  // Look through the last few turns so system cards don't suppress ACT suggestions.
  const lastResponse = turns.length > 0 ? turns[turns.length - 1].response : null;
  const lastActResponse = [...turns].reverse().find(t => t.response?.intent === 'act')?.response ?? null;
  const showAskSuggest     = !loading && lastResponse?.intent === 'ask' &&
    lastResponse?.answerability === 'answerable';
  const showAnalyzeSuggest = !loading && lastResponse?.intent === 'analyze' &&
    (lastResponse?.recommendations?.length ?? 0) > 0;
  // Show "Did it work?" after ACT with pending approval — survives system card injection
  const showActSuggest     = !loading && !!lastActResponse &&
    lastActResponse.act_decision_outcome === 'REQUIRES_HUMAN_APPROVAL' &&
    !!lastActResponse.act_pending_approval_id &&
    // Suppress once OBSERVE_OUTCOME has been answered in this conversation
    !turns.some(t => t.response?.intent === 'observe_outcome');

  return (
    <Box
      data-testid="copilot-drawer"
      role="complementary"
      aria-label="Copilot panel"
      sx={{
        position: 'fixed',
        top: 0, right: 0,
        width: '360px',
        height: '100vh',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        background: '#0D1117',
        border: '1px solid #21262D',
        borderRight: 'none',
        fontFamily: 'monospace',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: '14px', py: '10px',
        borderBottom: '1px solid #21262D',
        flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700,
            color: '#58A6FF', letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            COPILOT
          </Typography>
          <Box component="span" sx={{
            fontFamily: 'monospace', fontSize: '0.52rem', color: '#58A6FF',
            border: '1px solid #1F6FEB44', borderRadius: '3px',
            px: '4px', py: '0px', lineHeight: 1.6,
          }}>
            提问 · 分析 · 执行
          </Box>
        </Box>
        <Box
          component="button"
          onClick={onClose}
          aria-label="Close Copilot panel"
          sx={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'monospace', fontSize: '1rem', color: '#484F58', lineHeight: 1,
            px: '4px', py: '2px',
            '&:hover': { color: '#C9D1D9' },
          }}
        >
          ×
        </Box>
      </Box>

      {/* ── Conversation thread ─────────────────────────────────────────────── */}
      <Box
        ref={threadRef}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: '14px',
          py: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: '#0D1117' },
          '&::-webkit-scrollbar-thumb': { background: '#21262D', borderRadius: '2px' },
        }}
      >
        {/* Empty state */}
        {turns.length === 0 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: '60px', gap: 1 }}>
            <Typography sx={{
              fontFamily: 'monospace', fontSize: '0.65rem', color: '#30363D',
              textAlign: 'center', letterSpacing: '0.06em',
            }}>
              询问仓库状态或请求建议
            </Typography>
            <Typography sx={{
              fontFamily: 'monospace', fontSize: '0.58rem', color: '#21262D',
              textAlign: 'center',
            }}>
              人力可用 · 设备状态 · 波次风险 · 库存
            </Typography>
          </Box>
        )}

        {/* Turns */}
        {turns.map((turn, idx) => {
          const isLatest = idx === turns.length - 1;

          // System card — governance boundary notification (injected by RETURN TO COPILOT)
          if (turn.systemCard) {
            const card = turn.systemCard;
            const approved = card.decision === 'APPROVED';
            return (
              <Box
                key={turn.id}
                data-testid="copilot-system-card"
                sx={{
                  background: approved ? '#0D1B0D' : '#1A1200',
                  border: `1px solid ${approved ? '#3FB95044' : '#D2992244'}`,
                  borderRadius: '5px',
                  px: '10px', py: '8px',
                  display: 'flex', flexDirection: 'column', gap: '4px',
                }}
              >
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: '0.52rem', fontWeight: 700,
                  color: '#484F58', letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>
                  受治理行动已处理
                </Typography>
                <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap', mt: '2px' }}>
                  <Box sx={{ display: 'flex', gap: '4px' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#484F58' }}>决策</Typography>
                    <Typography sx={{
                      fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700,
                      color: approved ? '#3FB950' : '#D29922',
                    }}>{card.decision}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: '4px' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#484F58' }}>执行</Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#8B949E' }}>{card.execution}</Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#8B949E', mt: '2px' }}>
                  {card.action}
                </Typography>
              </Box>
            );
          }

          return (
          <Box key={turn.id} sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* User bubble */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{
                background: '#161B22',
                border: '1px solid #21262D',
                borderRadius: '6px',
                px: '10px', py: '7px',
                maxWidth: '85%',
              }}>
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: '0.75rem', color: '#C9D1D9',
                  lineHeight: 1.4,
                }}>
                  {turn.question}
                </Typography>
              </Box>
            </Box>

            {/* Response */}
            <Box sx={{ maxWidth: '100%' }}>
              {turn.response ? (
                turn.response.intent === 'act'
                  ? <CopilotActAnswer turn={turn.response} isLatest={isLatest} onReviewApproval={onReviewApproval} />
                  : turn.response.intent === 'observe_outcome'
                  ? <CopilotObserveAnswer turn={turn.response} isLatest={isLatest} />
                  : <CopilotAnswer turn={turn.response} isLatest={isLatest} onViewOperationalContext={onViewOperationalContext} onViewContextAtDecisionTime={onViewContextAtDecisionTime} />
              ) : turn.error ? (
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: '0.72rem', color: '#F85149',
                }}>
                  ✗ {turn.error}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#58A6FF',
                    animation: 'pulse 1s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 0.3 },
                      '50%': { opacity: 1 },
                    },
                  }} />
                  <Typography sx={{
                    fontFamily: 'monospace', fontSize: '0.65rem', color: '#58A6FF',
                    letterSpacing: '0.08em',
                  }}>
                    {activeStages[loadingStageIdx]}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          );
        })}

        {/* Suggested prompt after ASK */}
        {showAskSuggest && (
          <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {SUGGEST_AFTER_ASK.map(prompt => (
              <Box
                key={prompt}
                component="button"
                data-testid="copilot-suggested-prompt"
                onClick={() => handleSend(prompt)}
                sx={{
                  background: 'transparent',
                  border: '1px solid #21262D',
                  borderRadius: '4px',
                  px: '8px', py: '4px',
                  fontFamily: 'monospace', fontSize: '0.65rem',
                  color: '#484F58', cursor: 'pointer',
                  '&:hover': { color: '#58A6FF', borderColor: '#58A6FF44' },
                }}
              >
                {prompt}
              </Box>
            ))}
          </Box>
        )}

        {/* Suggested "Do it." after ANALYZE */}
        {showAnalyzeSuggest && (
          <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {SUGGEST_AFTER_ANALYZE.map(prompt => (
              <Box
                key={prompt}
                component="button"
                data-testid="copilot-act-suggested-prompt"
                onClick={() => handleSend(prompt)}
                sx={{
                  background: 'transparent',
                  border: '1px solid #D2992244',
                  borderRadius: '4px',
                  px: '8px', py: '4px',
                  fontFamily: 'monospace', fontSize: '0.65rem',
                  color: '#D29922', cursor: 'pointer',
                  '&:hover': { color: '#F0A400', borderColor: '#F0A40044' },
                }}
              >
                {prompt}
              </Box>
            ))}
          </Box>
        )}

        {/* Suggested "Did it work?" after ACT pending approval */}
        {showActSuggest && (
          <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {SUGGEST_AFTER_ACT.map(prompt => (
              <Box
                key={prompt}
                component="button"
                data-testid="copilot-observe-suggested-prompt"
                onClick={() => handleSend(prompt)}
                sx={{
                  background: 'transparent',
                  border: '1px solid #3FB95044',
                  borderRadius: '4px',
                  px: '8px', py: '4px',
                  fontFamily: 'monospace', fontSize: '0.65rem',
                  color: '#3FB950', cursor: 'pointer',
                  '&:hover': { color: '#4BD661', borderColor: '#4BD66144' },
                }}
              >
                {prompt}
              </Box>
            ))}
          </Box>
        )}

        {/* Global error */}
        {conversationError && turns.length === 0 && (
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.7rem', color: '#F85149',
          }}>
            ✗ {conversationError}
          </Typography>
        )}
      </Box>

      {/* ── Input area ─────────────────────────────────────────────────────────── */}
      <Box sx={{
        flexShrink: 0,
        borderTop: '1px solid #21262D',
        px: '12px', py: '10px',
        display: 'flex', gap: '8px',
        background: '#0D1117',
      }}>
        <Box
          component="input"
          data-testid="copilot-input"
          value={inputMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="提问或请求建议…"
          disabled={loading}
          aria-label="Copilot question input"
          sx={{
            flexGrow: 1,
            background: '#161B22',
            border: '1px solid #21262D',
            borderRadius: '4px',
            px: '10px', py: '7px',
            fontFamily: 'monospace', fontSize: '0.75rem',
            color: '#C9D1D9',
            outline: 'none',
            '&::placeholder': { color: '#484F58' },
            '&:focus': { borderColor: '#30363D' },
            '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
          }}
        />
        <Box
          component="button"
          data-testid="copilot-send"
          onClick={() => handleSend()}
          disabled={loading || !inputMessage.trim()}
          aria-label="Send question"
          sx={{
            background: loading || !inputMessage.trim() ? 'transparent' : '#1C2128',
            border: '1px solid #21262D',
            borderRadius: '4px',
            px: '12px',
            fontFamily: 'monospace', fontSize: '0.65rem',
            color: loading || !inputMessage.trim() ? '#484F58' : '#58A6FF',
            cursor: loading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            '&:hover:not(:disabled)': { borderColor: '#30363D' },
          }}
        >
          {loading ? '…' : '发送'}
        </Box>
      </Box>
    </Box>
  );
}
