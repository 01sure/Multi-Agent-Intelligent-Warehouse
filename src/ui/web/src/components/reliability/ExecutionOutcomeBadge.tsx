import React from 'react';
import { Box, Typography } from '@mui/material';

export type ExecutionOutcome =
  | 'EXECUTED'
  | 'NO_OP'
  | 'DEFERRED'
  | 'CONFLICT'
  | 'UNKNOWN'
  | 'FAILED';

export type ReconciliationOutcome =
  | 'CONFIRMED_EXECUTED'
  | 'CONFIRMED_NOT_EXECUTED'
  | 'INDETERMINATE'
  | 'RECONCILING';

const OUTCOME_META: Record<ExecutionOutcome, { label: string; color: string; desc: string }> = {
  EXECUTED:  { label: 'EXECUTED',  color: '#3FB950', desc: '变更已确认' },
  NO_OP:     { label: 'NO-OP',     color: '#58A6FF', desc: '幂等重放 — 无新变更' },
  DEFERRED:  { label: 'DEFERRED',  color: '#D29922', desc: '等待人工审批' },
  CONFLICT:  { label: 'CONFLICT',  color: '#E3B341', desc: '状态漂移已阻止执行' },
  UNKNOWN:   { label: 'UNKNOWN',   color: '#F0883E', desc: '变更可能已发生 — 重试前请先对账' },
  FAILED:    { label: 'FAILED',    color: '#F85149', desc: '无变更 — 可安全重新评估' },
};

const RECONCILE_META: Record<ReconciliationOutcome, { label: string; color: string; desc: string }> = {
  RECONCILING:           { label: 'RECONCILING',        color: '#58A6FF', desc: '正在检查权威状态…' },
  CONFIRMED_EXECUTED:    { label: 'CONFIRMED EXECUTED',  color: '#3FB950', desc: '确认变更存在' },
  CONFIRMED_NOT_EXECUTED:{ label: 'NOT EXECUTED',        color: '#8B949E', desc: '未发现变更 — 可安全重试' },
  INDETERMINATE:         { label: 'INDETERMINATE',       color: '#D29922', desc: '无法确定 — 需人工复核' },
};

interface Props {
  outcome: ExecutionOutcome;
  reconciliation?: ReconciliationOutcome;
  compact?: boolean;
}

export default function ExecutionOutcomeBadge({ outcome, reconciliation, compact = false }: Props) {
  const meta = OUTCOME_META[outcome];

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 0.5 }}>
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.5,
        px: compact ? 0.5 : 0.75, py: compact ? 0.1 : 0.25,
        borderRadius: 0.5,
        border: `1px solid ${meta.color}33`,
        backgroundColor: `${meta.color}11`,
      }}>
        <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: meta.color, flexShrink: 0 }} />
        <Typography sx={{
          fontFamily: 'monospace', fontSize: compact ? '0.6rem' : '0.68rem',
          fontWeight: 700, color: meta.color, letterSpacing: '0.06em',
        }}>
          {meta.label}
        </Typography>
      </Box>

      {!compact && (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#6E7681' }}>
          {meta.desc}
        </Typography>
      )}

      {reconciliation && (
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.5,
          px: compact ? 0.5 : 0.75, py: compact ? 0.1 : 0.25,
          borderRadius: 0.5,
          border: `1px solid ${RECONCILE_META[reconciliation].color}33`,
          backgroundColor: `${RECONCILE_META[reconciliation].color}11`,
        }}>
          <Typography sx={{
            fontFamily: 'monospace', fontSize: compact ? '0.55rem' : '0.62rem',
            color: RECONCILE_META[reconciliation].color, letterSpacing: '0.04em',
          }}>
            → {RECONCILE_META[reconciliation].label}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
