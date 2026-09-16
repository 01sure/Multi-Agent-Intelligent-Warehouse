/**
 * ReliabilityLifecycleNarrative — vertical fault-path narrative driven by SSE events.
 *
 * Each step activates when its corresponding SSE event(s) fire. No optimistic
 * advancement — only actual events complete a step.
 *
 * Scenario → SSE category mapping:
 *   F06 Ambiguous Write:
 *     FAULT      ← INJECT or FAULT_INJECTED
 *     EXECUTE    ← EXECUTE
 *     UNKNOWN    ← RECONCILIATION_REQUIRED
 *     SAFETY     ← (automatic after UNKNOWN; same condition)
 *     RECONCILE  ← RECONCILE
 *     CONFIRMED  ← CONFIRMED_EXECUTED or CONFIRMED_NOT_EXECUTED or INDETERMINATE
 *   F07 Duplicate Approval:
 *     APPROVE ×1 ← APPROVE (first event)
 *     CONSUMED   ← APPROVE (subsequent events; or 404 tracked locally)
 *     SAFETY     ← same
 *   F10 State Drift:
 *     FAULT      ← INJECT or FAULT_INJECTED
 *     EXECUTE    ← EXECUTE
 *     CONFLICT   ← EXECUTE with outcome=conflict in detail (or just EXECUTE)
 *     SAFETY     ← same
 *   F12 Circuit Open:
 *     CIRCUIT_OPEN ← CIRCUIT_OPEN
 *     SAFETY       ← CIRCUIT_OPEN
 *     DEGRADED     ← from runtime.maiw_operational_status === 'DEGRADED'
 *   F01 NIM Timeout:
 *     TIMEOUT    ← MODEL TIMEOUT or REQUEST DEADLINE
 *     SAFETY     ← same
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { SSEEvent } from '../../../hooks/useDemoSSE';

// ── Step types ────────────────────────────────────────────────────────────────

type StepStatus = 'pending' | 'active' | 'complete';

interface NarrativeStep {
  id: string;
  label: string;
  sublabel: string;
  completed: (events: SSEEvent[], runtime: any) => boolean;
}

// ── Per-scenario step definitions ─────────────────────────────────────────────

const F06_STEPS: NarrativeStep[] = [
  {
    id: 'fault',
    label: 'FAULT',
    sublabel: '变更后 MCP 写入超时',
    completed: (e) => e.some(ev => ev.category === 'INJECT' || ev.category === 'FAULT_INJECTED'),
  },
  {
    id: 'execute',
    label: 'EXECUTE',
    sublabel: '行动已派发给提供方',
    completed: (e) => e.some(ev => ev.category === 'EXECUTE'),
  },
  {
    id: 'unknown',
    label: 'UNKNOWN',
    sublabel: '确认丢失——变更状态不确定',
    completed: (e) => e.some(ev => ev.category === 'RECONCILIATION_REQUIRED'),
  },
  {
    id: 'safety',
    label: 'SAFETY',
    sublabel: '已自动抑制重试',
    completed: (e) => e.some(ev => ev.category === 'RECONCILIATION_REQUIRED'),
  },
  {
    id: 'reconcile',
    label: 'RECONCILE',
    sublabel: '已对照权威源读取状态',
    completed: (e) => e.some(ev => ev.category === 'RECONCILE'),
  },
  {
    id: 'confirmed',
    label: 'CONFIRMED EXECUTED',
    sublabel: '对账完成：已确认变更',
    completed: (e) => e.some(ev =>
      ev.category === 'CONFIRMED_EXECUTED' ||
      ev.category === 'CONFIRMED_NOT_EXECUTED' ||
      ev.category === 'INDETERMINATE'
    ),
  },
];

const F07_STEPS: NarrativeStep[] = [
  {
    id: 'approve1',
    label: 'APPROVE ×1',
    sublabel: '首次授权已接受',
    completed: (e) => e.some(ev => ev.category === 'APPROVE'),
  },
  {
    id: 'consumed',
    label: 'CONSUMED ×2',
    sublabel: '后续尝试被拦截：404 已消耗',
    completed: (e) => e.filter(ev => ev.category === 'APPROVE').length > 1,
  },
  {
    id: 'safety',
    label: 'SAFETY',
    sublabel: '已阻止重复审批——仅一次变更',
    completed: (e) => e.filter(ev => ev.category === 'APPROVE').length > 1,
  },
];

const F10_STEPS: NarrativeStep[] = [
  {
    id: 'fault',
    label: 'FAULT',
    sublabel: '提案提交后世界状态发生变化',
    completed: (e) => e.some(ev => ev.category === 'INJECT' || ev.category === 'FAULT_INJECTED'),
  },
  {
    id: 'execute',
    label: 'EXECUTE',
    sublabel: '在漂移后的状态上尝试执行',
    completed: (e) => e.some(ev => ev.category === 'EXECUTE'),
  },
  {
    id: 'conflict',
    label: 'CONFLICT',
    sublabel: 'ActionConflict——检测到状态漂移',
    completed: (e) => e.some(ev => ev.category === 'EXECUTE' &&
      (ev.detail?.includes('conflict') || ev.message?.includes('conflict'))
    ),
  },
  {
    id: 'safety',
    label: 'SAFETY',
    sublabel: '防护 5（状态漂移）已阻止执行',
    completed: (e) => e.some(ev => ev.category === 'EXECUTE' &&
      (ev.detail?.includes('conflict') || ev.message?.includes('conflict'))
    ),
  },
];

const F12_STEPS: NarrativeStep[] = [
  {
    id: 'circuit_open',
    label: 'CIRCUIT OPEN',
    sublabel: '人力 MCP 域不可用',
    completed: (e) => e.some(ev => ev.category === 'CIRCUIT_OPEN'),
  },
  {
    id: 'safety',
    label: 'SAFETY',
    sublabel: '域已隔离——设备/库存仍可用',
    completed: (e) => e.some(ev => ev.category === 'CIRCUIT_OPEN'),
  },
  {
    id: 'degraded',
    label: 'DEGRADED',
    sublabel: '运行状态 DEGRADED（非不可用）',
    completed: (_e, runtime) => runtime?.maiw_operational_status === 'DEGRADED',
  },
];

const F01_STEPS: NarrativeStep[] = [
  {
    id: 'timeout',
    label: 'NIM TIMEOUT',
    sublabel: '模型未及时响应',
    completed: (e) => e.some(ev =>
      ev.category === 'MODEL TIMEOUT' || ev.category === 'REQUEST DEADLINE'
    ),
  },
  {
    id: 'safety',
    label: 'SAFETY',
    sublabel: '未产生提案或执行——向调用方返回 504',
    completed: (e) => e.some(ev =>
      ev.category === 'MODEL TIMEOUT' || ev.category === 'REQUEST DEADLINE'
    ),
  },
];

const SCENARIO_STEPS: Record<string, NarrativeStep[]> = {
  F06: F06_STEPS,
  F07: F07_STEPS,
  F10: F10_STEPS,
  F12: F12_STEPS,
  F01: F01_STEPS,
};

// ── Node ──────────────────────────────────────────────────────────────────────

function NarrativeNode({
  step,
  status,
  isLast,
}: {
  step: NarrativeStep;
  status: StepStatus;
  isLast: boolean;
}) {
  const color =
    status === 'complete' ? '#3FB950' :
    status === 'active'   ? '#D29922' :
    '#30363D';

  const icon =
    status === 'complete' ? '✓' :
    status === 'active'   ? '●' : '○';

  return (
    <Box data-testid={`narrative-step-${step.id}`} data-status={status}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {/* Icon + connector */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color, lineHeight: 1 }}>
            {icon}
          </Typography>
          {!isLast && (
            <Box sx={{ width: '1px', height: 28, background: color === '#30363D' ? '#21262D' : `${color}44`, mt: '4px' }} />
          )}
        </Box>

        {/* Label */}
        <Box sx={{ pb: isLast ? 0 : 1.5 }}>
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700,
            color: color === '#30363D' ? '#484F58' : color,
            letterSpacing: '0.04em',
          }}>
            {step.label}
          </Typography>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#484F58' }}>
            {step.sublabel}
          </Typography>
          {step.id === 'safety' && status !== 'pending' && (
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.58rem', color: '#3FB950', mt: '2px' }}>
              ✓ 不变量保持
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ── ReliabilityLifecycleNarrative ─────────────────────────────────────────────

interface Props {
  scenarioId: string;
  sseEvents: SSEEvent[];
  runtime?: any;
}

export default function ReliabilityLifecycleNarrative({ scenarioId, sseEvents, runtime }: Props) {
  const steps = SCENARIO_STEPS[scenarioId] ?? [];
  if (steps.length === 0) return null;

  // Derive status: once a step completes, all previous steps are also complete
  const completedMask = steps.map(s => s.completed(sseEvents, runtime));

  // Find the furthest completed step index
  const furthestComplete = completedMask.reduce((last, done, i) => done ? i : last, -1);

  const statuses: StepStatus[] = steps.map((_, i) => {
    if (i <= furthestComplete) return 'complete';
    if (i === furthestComplete + 1) return 'active';
    return 'pending';
  });

  return (
    <Box data-testid={`narrative-${scenarioId}`} sx={{ py: 0.5 }}>
      {steps.map((step, i) => (
        <NarrativeNode
          key={step.id}
          step={step}
          status={statuses[i]}
          isLast={i === steps.length - 1}
        />
      ))}
    </Box>
  );
}
