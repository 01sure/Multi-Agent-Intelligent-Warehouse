/**
 * OutcomeStage — observed operational impact after execution.
 *
 * Data sources (atomic backend truth — never two polls):
 *   analysisResult.pre_kpis  — KPISnapshot before action
 *   analysisResult.post_kpis — KPISnapshot after action
 *   analysisResult.kpi_delta — signed deltas (pre→post)
 *   demoStatus.kpi_history   — full history for trend chart
 *
 * Design contracts:
 *   - Header reads "OBSERVED OPERATIONAL IMPACT" — never "Projected impact"
 *   - Execution result section is distinct from operational outcome section
 *   - time_to_recovery_seconds = null → show "RECOVERY NOT YET REACHED"
 *   - CounterfactualPanel is lazy-mounted on button click (self-fetches its own data)
 *   - onReset callback drives "RUN ANOTHER SCENARIO" — no auto-restart
 */

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { KPIDelta, KPISnapshot } from '../../../services/demoAPI';
import CounterfactualPanel from '../CounterfactualPanel';
import KPITrendChart from '../KPITrendChart';
import {
  SectionHeader,
  StageSection,
  MonoText,
  IdText,
  StageContentPaneProps,
} from '../StageContentPane';

// ── Delta display helpers ─────────────────────────────────────────────────────

function deltaColor(delta: number | undefined | null, positiveIsBetter: boolean): string {
  if (delta === undefined || delta === null) return '#484F58';
  if (delta === 0) return '#6E7681';
  const good = positiveIsBetter ? delta > 0 : delta < 0;
  return good ? '#3FB950' : '#F85149';
}

function fmtNum(v: number | undefined | null, digits = 1, suffix = ''): string {
  if (v === undefined || v === null) return '—';
  return `${v.toFixed(digits)}${suffix}`;
}

function fmtDelta(v: number | undefined | null, suffix = '', positiveIsBetter = true): { text: string; color: string } {
  if (v === undefined || v === null) return { text: '—', color: '#484F58' };
  const sign = v > 0 ? '+' : '';
  return {
    text: `${sign}${v.toFixed(1)}${suffix}`,
    color: deltaColor(v, positiveIsBetter),
  };
}

// ── KPI delta table ───────────────────────────────────────────────────────────

interface KPIRow {
  label: string;
  pre: number | undefined | null;
  post: number | undefined | null;
  delta: number | undefined | null;
  suffix: string;
  positiveIsBetter: boolean;
}

function KPIDeltaRow({ row }: { row: KPIRow }) {
  const { text: deltaText, color: deltaCol } = fmtDelta(row.delta, row.suffix, row.positiveIsBetter);
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 1, py: '5px', borderBottom: '1px solid #1C2128' }}>
      <MonoText color="#6E7681" size="0.68rem">{row.label}</MonoText>
      <MonoText color="#8B949E" size="0.68rem">{fmtNum(row.pre, 1, row.suffix)}</MonoText>
      <MonoText color="#C9D1D9" size="0.68rem">{fmtNum(row.post, 1, row.suffix)}</MonoText>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.68rem', color: deltaCol, fontWeight: delta => delta ? 700 : 400 }}>
        {deltaText}
      </Typography>
    </Box>
  );
}

function kpiRows(pre: KPISnapshot | undefined, post: KPISnapshot | undefined, delta: KPIDelta | undefined): KPIRow[] {
  return [
    {
      label: '波次风险评分',
      pre: pre?.wave_risk_score,
      post: post?.wave_risk_score,
      delta: delta?.wave_risk_score,
      suffix: '',
      positiveIsBetter: false,
    },
    {
      label: '待处理积压',
      pre: pre?.pending_backlog,
      post: post?.pending_backlog,
      delta: delta?.pending_backlog,
      suffix: '',
      positiveIsBetter: false,
    },
    {
      label: '波次完成率',
      pre: pre?.wave_completion_pct,
      post: post?.wave_completion_pct,
      delta: delta?.wave_completion_pct,
      suffix: '%',
      positiveIsBetter: true,
    },
    {
      label: '人力利用率',
      pre: pre?.labor_utilization_pct,
      post: post?.labor_utilization_pct,
      delta: delta?.labor_utilization_pct,
      suffix: '%',
      positiveIsBetter: true,
    },
    {
      label: '设备运行率',
      pre: pre?.equipment_operational_pct,
      post: post?.equipment_operational_pct,
      delta: delta?.equipment_operational_pct,
      suffix: '%',
      positiveIsBetter: true,
    },
  ];
}

// ── OutcomeStage ──────────────────────────────────────────────────────────────

export default function OutcomeStage({ analysisResult, demoStatus, onReset, onOpenExplanation, onViewFullTrace }: StageContentPaneProps) {
  const [showCounterfactual, setShowCounterfactual] = useState(false);

  const pre = analysisResult?.pre_kpis;
  const post = analysisResult?.post_kpis;
  const delta = analysisResult?.kpi_delta;
  const hasKPIData = !!(pre && post && delta);

  // Lifecycle markers for the KPI trend chart
  const lifecycleMarkers = [
    pre  ? { sim_time_seconds: pre.sim_time_seconds,  category: 'OBSERVE', label: '执行前' }  : null,
    post ? { sim_time_seconds: post.sim_time_seconds, category: 'EXECUTE', label: '执行后' } : null,
  ].filter(Boolean) as Array<{ sim_time_seconds: number; category: string; label: string }>;

  // Execution result summary from proposal_results
  const proposalResults = analysisResult?.proposal_results ?? [];

  // Recovery
  const ttrPost = post?.time_to_recovery_seconds;
  const traceId = analysisResult?.trace_id;

  return (
    <Box data-testid="outcome-stage">
      {/* Stage header */}
      <StageSection>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{
            fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700,
            color: '#58A6FF', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            结果
          </Typography>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#484F58' }}>
            受治理 MAIW 行动的运营后果
          </Typography>
        </Box>
      </StageSection>

      {/* Decision provenance CTA */}
      {onOpenExplanation && (
        <Box sx={{ mb: 1.5 }}>
          <Box
            component="button"
            onClick={() => onOpenExplanation({ kind: 'stage', stage: 'OUTCOME' })}
            data-testid="explain-outcome-button"
            sx={{
              background: 'transparent',
              border: '1px solid #30363D',
              borderRadius: '4px',
              color: '#58A6FF',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              px: '12px',
              py: '6px',
              transition: 'all 0.12s ease',
              '&:hover': { borderColor: '#58A6FF', background: '#0d2146' },
            }}
          >
            查看决策溯源 →
          </Box>
        </Box>
      )}

      {/* Execution result — distinct from operational outcome */}
      {proposalResults.length > 0 && (
        <StageSection>
          <SectionHeader>执行结果</SectionHeader>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {proposalResults.map((pr, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <MonoText color="#8B949E" size="0.68rem">{pr.capability}</MonoText>
                <Box component="span" sx={{
                  fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700,
                  color: pr.status === 'executed' ? '#3FB950' : pr.status === 'unknown' ? '#D29922' : '#F85149',
                  border: `1px solid ${pr.status === 'executed' ? '#3FB950' : '#F85149'}22`,
                  borderRadius: '3px', px: '5px', py: '1px',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {pr.status?.toUpperCase() ?? '—'}
                </Box>
                {pr.execution_id && (
                  <IdText label="exec_id" value={pr.execution_id} />
                )}
              </Box>
            ))}
          </Box>
          {traceId && (
            <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <IdText label="trace" value={traceId} />
              {onViewFullTrace && (
                <Box
                  component="button"
                  onClick={onViewFullTrace}
                  data-testid="outcome-view-full-trace-button"
                  sx={{
                    background: 'transparent',
                    border: '1px solid #30363D',
                    borderRadius: '4px',
                    color: '#58A6FF',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    px: '8px',
                    py: '3px',
                    transition: 'all 0.12s ease',
                    '&:hover': { borderColor: '#58A6FF', background: '#0d2146' },
                  }}
                >
                  查看完整追踪 →
                </Box>
              )}
            </Box>
          )}
        </StageSection>
      )}

      {/* Observed operational impact */}
      <StageSection>
        <SectionHeader>观察到的运营影响</SectionHeader>
        {hasKPIData ? (
          <>
            {/* Column headers */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 1, pb: '4px', borderBottom: '1px solid #21262D' }}>
              <MonoText color="#30363D" size="0.6rem">指标</MonoText>
              <MonoText color="#30363D" size="0.6rem">执行前</MonoText>
              <MonoText color="#30363D" size="0.6rem">执行后</MonoText>
              <MonoText color="#30363D" size="0.6rem">差值</MonoText>
            </Box>
            {kpiRows(pre, post, delta).map(row => (
              <KPIDeltaRow key={row.label} row={row} />
            ))}
          </>
        ) : (
          <Box data-testid="no-kpi-data">
            <MonoText color="#484F58" size="0.65rem">
              {analysisResult ? '本次运行无 KPI 快照数据。' : '运行分析以查看运营影响。'}
            </MonoText>
          </Box>
        )}
      </StageSection>

      {/* Time to recovery */}
      <StageSection>
        <SectionHeader>恢复时间</SectionHeader>
        {ttrPost !== undefined && ttrPost !== null ? (
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }} data-testid="recovery-time">
            <Typography sx={{
              fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: '#3FB950',
            }}>
              {ttrPost < 60 ? `${Math.round(ttrPost)}s` : `${Math.round(ttrPost / 60)}m`}
            </Typography>
            <MonoText color="#484F58" size="0.62rem">模拟时间内已恢复</MonoText>
          </Box>
        ) : (
          <Box data-testid="recovery-not-reached">
            <MonoText color="#484F58" size="0.68rem">
              尚未达到恢复点
            </MonoText>
          </Box>
        )}
      </StageSection>

      {/* KPI history chart */}
      <StageSection>
        <SectionHeader>KPI 历史</SectionHeader>
        <KPITrendChart
          history={demoStatus?.kpi_history ?? []}
          lifecycleEvents={lifecycleMarkers}
          height={140}
        />
      </StageSection>

      {/* End-state actions */}
      <StageSection last>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* VIEW CONTROL vs MAIW */}
          <Box
            component="button"
            onClick={() => setShowCounterfactual(c => !c)}
            data-testid="counterfactual-button"
            sx={{
              background: showCounterfactual ? '#0d2146' : 'transparent',
              border: showCounterfactual ? '1px solid #1F6FEB' : '1px solid #30363D',
              borderRadius: '4px',
              px: '12px', py: '7px',
              fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 600,
              color: showCounterfactual ? '#58A6FF' : '#6E7681',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              transition: 'all 0.12s ease',
              '&:hover': { color: '#58A6FF', borderColor: '#1F6FEB' },
            }}
          >
            {showCounterfactual ? '▾ 隐藏 对照组 vs MAIW' : '▸ 查看 对照组 vs MAIW'}
          </Box>

          {/* RUN ANOTHER SCENARIO */}
          <Box
            component="button"
            onClick={() => onReset?.()}
            data-testid="run-another-scenario-button"
            sx={{
              background: 'transparent',
              border: '1px solid #21262D',
              borderRadius: '4px',
              px: '12px', py: '7px',
              fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 600,
              color: '#6E7681',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              transition: 'all 0.12s ease',
              '&:hover': { color: '#C9D1D9', borderColor: '#30363D' },
            }}
          >
            运行另一个场景
          </Box>
        </Box>

        {/* Inline counterfactual panel */}
        {showCounterfactual && (
          <Box
            data-testid="counterfactual-panel-inline"
            sx={{
              mt: 2,
              background: '#161B22',
              border: '1px solid #21262D',
              borderRadius: '6px',
              p: 2,
            }}
          >
            <CounterfactualPanel />
          </Box>
        )}
      </StageSection>
    </Box>
  );
}
