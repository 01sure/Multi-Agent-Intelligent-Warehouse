/**
 * ReconciliationStatus — shows live UNKNOWN / reconciliation state from SSE.
 *
 * Listens for:
 *   RECONCILIATION_REQUIRED → surfaces RECONCILE NOW prompt with execution_id
 *   RECONCILE              → shows "Reconciliation in progress"
 *   CONFIRMED_EXECUTED     → shows "CONFIRMED EXECUTED" with execution_id
 *   CONFIRMED_NOT_EXECUTED → shows "CONFIRMED NOT EXECUTED"
 *   INDETERMINATE          → shows "INDETERMINATE — manual review required"
 *
 * Quiet state: nothing rendered when no relevant events exist.
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { SSEEvent, parseEventDetail } from '../../../hooks/useDemoSSE';

interface Props {
  sseEvents: SSEEvent[];
  onReconcile?: (executionId: string, domain: string) => void;
}

type ReconcileState =
  | { phase: 'idle' }
  | { phase: 'required'; executionId: string; domain: string }
  | { phase: 'in_progress'; executionId: string }
  | { phase: 'confirmed_executed'; executionId: string }
  | { phase: 'confirmed_not_executed'; executionId: string }
  | { phase: 'indeterminate'; executionId: string };

function deriveState(events: SSEEvent[]): ReconcileState {
  // Walk newest-first; resolve to the furthest progressed state
  const hasConfirmedExec = events.find(e => e.category === 'CONFIRMED_EXECUTED');
  const hasConfirmedNot = events.find(e => e.category === 'CONFIRMED_NOT_EXECUTED');
  const hasIndeterminate = events.find(e => e.category === 'INDETERMINATE');
  const hasReconcile = events.find(e => e.category === 'RECONCILE');
  const hasRequired = events.find(e => e.category === 'RECONCILIATION_REQUIRED');

  const pickExecId = (ev: SSEEvent | undefined): string => {
    const d = ev ? parseEventDetail(ev) : null;
    return d?.execution_id ?? ev?.execution_id ?? '—';
  };

  if (hasConfirmedExec) {
    return { phase: 'confirmed_executed', executionId: pickExecId(hasConfirmedExec) };
  }
  if (hasConfirmedNot) {
    return { phase: 'confirmed_not_executed', executionId: pickExecId(hasConfirmedNot) };
  }
  if (hasIndeterminate) {
    return { phase: 'indeterminate', executionId: pickExecId(hasIndeterminate) };
  }
  if (hasReconcile) {
    return { phase: 'in_progress', executionId: pickExecId(hasReconcile) };
  }
  if (hasRequired) {
    const id = pickExecId(hasRequired);
    const det = parseEventDetail(hasRequired);
    const domain = det?.domain ?? hasRequired?.domain ?? 'equipment';
    return { phase: 'required', executionId: id, domain };
  }
  return { phase: 'idle' };
}

const PHASE_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  required: {
    label: '需要对账',
    color: '#D29922',
    bg: '#1C1500',
    border: '#D2992244',
  },
  in_progress: {
    label: '对账进行中',
    color: '#58A6FF',
    bg: '#0d1930',
    border: '#1F6FEB44',
  },
  confirmed_executed: {
    label: '已确认执行',
    color: '#3FB950',
    bg: '#0d1a0d',
    border: '#3FB95044',
  },
  confirmed_not_executed: {
    label: '已确认未执行',
    color: '#F85149',
    bg: '#1a0d0d',
    border: '#F8514944',
  },
  indeterminate: {
    label: '不确定',
    color: '#F0883E',
    bg: '#1a1100',
    border: '#F0883E44',
  },
};

export default function ReconciliationStatus({ sseEvents, onReconcile }: Props) {
  const state = deriveState(sseEvents);

  if (state.phase === 'idle') return null;

  const style = PHASE_STYLES[state.phase];
  const execId = (state as any).executionId;

  return (
    <Box
      data-testid="reconciliation-status"
      data-phase={state.phase}
      sx={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '6px',
        px: 1.75,
        py: 1.25,
      }}
    >
      <Typography sx={{
        fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700,
        color: style.color, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5,
      }}>
        {style.label}
      </Typography>

      {execId && execId !== '—' && (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#484F58', mb: 0.5 }}>
          执行 ID: {execId}
        </Typography>
      )}

      {state.phase === 'required' && (
        <>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#8B949E', mb: 1 }}>
            已自动抑制重试。仓库可能已接受此操作。
            需要对账以确定结果。
          </Typography>
          {onReconcile && (
            <Box
              component="button"
              onClick={() => onReconcile((state as any).executionId, (state as any).domain)}
              data-testid="reconcile-status-button"
              sx={{
                background: '#0d2146',
                border: '1px solid #1F6FEB',
                borderRadius: '4px',
                px: '10px', py: '4px',
                fontFamily: 'monospace', fontSize: '0.65rem',
                color: '#58A6FF', cursor: 'pointer',
                letterSpacing: '0.04em',
                '&:hover': { background: '#0d2f6a' },
              }}
            >
              立即对账
            </Box>
          )}
        </>
      )}

      {state.phase === 'in_progress' && (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#8B949E' }}>
          正在查询权威状态源。等待结果。
        </Typography>
      )}

      {state.phase === 'confirmed_executed' && (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#3FB950' }}>
          ✓ 已在权威状态中确认存在变更。无需操作。
        </Typography>
      )}

      {state.phase === 'confirmed_not_executed' && (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#F85149' }}>
          ✗ 权威状态中不存在变更。防护机制拦截了假成功。
        </Typography>
      )}

      {state.phase === 'indeterminate' && (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#F0883E' }}>
          权威源未给出确定答案。需要人工复核。
        </Typography>
      )}
    </Box>
  );
}
