/**
 * SafetyScorecard — per-scenario Batch 6 validated evidence.
 *
 * VALIDATED BATCH 6 label: artifacts from Phase 10E Batch 6 test run.
 * Static data only. No API calls.
 *
 * Each scenario shows:
 *   - Invariants exercised
 *   - Batch 6 test result
 *   - Observed behavior
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

interface ScorecardEntry {
  invariant: string;
  invariantLabel: string;
  result: 'PASS';
  observed: string;
}

interface ScenarioScorecard {
  id: string;
  entries: ScorecardEntry[];
}

const SCORECARDS: Record<string, ScenarioScorecard> = {
  F06: {
    id: 'F06',
    entries: [
      {
        invariant: 'D',
        invariantLabel: '模糊写入安全',
        result: 'PASS',
        observed: '已触发 UNKNOWN，已抑制重试，对账结果为 CONFIRMED_EXECUTED',
      },
      {
        invariant: 'E',
        invariantLabel: '幂等防护',
        result: 'PASS',
        observed: 'UNKNOWN 窗口期内未应用重复变更',
      },
    ],
  },
  F07: {
    id: 'F07',
    entries: [
      {
        invariant: 'C',
        invariantLabel: '重复审批防护',
        result: 'PASS',
        observed: '第二次、第三次审批返回 404 已消耗；仅一次执行',
      },
    ],
  },
  F10: {
    id: 'F10',
    entries: [
      {
        invariant: 'B',
        invariantLabel: '状态漂移检测',
        result: 'PASS',
        observed: '执行时触发 ActionConflict；防护 5 阻止了对陈旧状态的写入',
      },
    ],
  },
  F12: {
    id: 'F12',
    entries: [
      {
        invariant: 'F',
        invariantLabel: '熔断隔离',
        result: 'PASS',
        observed: '人力域熔断；设备与库存保持 HEALTHY',
      },
      {
        invariant: 'A',
        invariantLabel: '优雅降级',
        result: 'PASS',
        observed: '运行状态 → DEGRADED（非 UNAVAILABLE）；部分服务继续运行',
      },
    ],
  },
  F01: {
    id: 'F01',
    entries: [
      {
        invariant: 'A',
        invariantLabel: 'NIM 超时安全',
        result: 'PASS',
        observed: '模型网关超时返回 504；未产生提案；未尝试执行',
      },
    ],
  },
};

interface Props {
  scenarioId: string | null;
}

export default function SafetyScorecard({ scenarioId }: Props) {
  const scorecard = scenarioId ? SCORECARDS[scenarioId] : null;

  return (
    <Box data-testid="safety-scorecard">
      {/* VALIDATED BATCH 6 header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{
          fontFamily: 'monospace', fontSize: '0.58rem', fontWeight: 700,
          color: '#3FB950', border: '1px solid #3FB95044', borderRadius: '3px',
          px: '5px', py: '2px', letterSpacing: '0.08em', textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          已验证批次 6
        </Box>
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.58rem', color: '#484F58' }}>
          Phase 10E 可靠性测试运行
        </Typography>
      </Box>

      {!scorecard && (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#484F58' }}>
          选择一个场景以查看批次 6 证据。
        </Typography>
      )}

      {scorecard && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {scorecard.entries.map(entry => (
            <Box
              key={entry.invariant}
              data-testid={`scorecard-invariant-${entry.invariant}`}
              sx={{
                background: '#0d1a0d',
                border: '1px solid #3FB95022',
                borderRadius: '4px',
                px: 1.25,
                py: 0.75,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: '3px' }}>
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700,
                  color: '#3FB950', letterSpacing: '0.06em',
                }}>
                  ✓ 不变量 {entry.invariant}
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#6E7681' }}>
                  {entry.invariantLabel}
                </Typography>
                <Box sx={{
                  fontFamily: 'monospace', fontSize: '0.55rem', fontWeight: 700,
                  color: '#3FB950', border: '1px solid #3FB95044', borderRadius: '2px',
                  px: '3px', py: '1px', letterSpacing: '0.08em',
                  ml: 'auto',
                }}>
                  {entry.result}
                </Box>
              </Box>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#484F58' }}>
                {entry.observed}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
