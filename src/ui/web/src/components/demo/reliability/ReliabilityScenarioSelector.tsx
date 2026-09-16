/**
 * ReliabilityScenarioSelector — five fault scenarios.
 * F06 (Ambiguous Write) is the recommended / hero scenario.
 *
 * Static definitions — no API call needed. Fault IDs and expected behaviors
 * come from Phase 10E Batch 6 validated artifacts.
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

// ── Scenario definitions ──────────────────────────────────────────────────────

export interface FaultScenario {
  id: string;
  recommended?: boolean;
  title: string;
  subtitle: string;
  expected: string;
  narrative: string[];
  domain?: string;
}

export const FAULT_SCENARIOS: FaultScenario[] = [
  {
    id: 'F06',
    recommended: true,
    title: '模糊写入',
    subtitle: '变更后 MCP 写入超时',
    expected: 'UNKNOWN → 不重试 → 对账 → 确认执行',
    narrative: ['FAULT', 'EXECUTE', 'UNKNOWN', 'SAFETY', 'RECONCILE', 'CONFIRMED'],
    domain: 'equipment',
  },
  {
    id: 'F07',
    title: '重复审批',
    subtitle: '对同一 pending_id 发起三次审批',
    expected: '一次授权 → 一次执行 → 一次变更',
    narrative: ['APPROVE ×1', 'CONSUMED ×2', 'SAFETY'],
  },
  {
    id: 'F10',
    title: '状态漂移',
    subtitle: '提议与执行之间世界状态发生变化',
    expected: '审批有效 → 状态变化 → 执行被阻止',
    narrative: ['FAULT', 'EXECUTE', 'CONFLICT', 'SAFETY'],
    domain: 'equipment',
  },
  {
    id: 'F12',
    title: '人力 MCP 熔断',
    subtitle: '人力域不可用；其余域正常',
    expected: '人力不可用 → 运行状态 DEGRADED；设备/库存仍可用',
    narrative: ['CIRCUIT_OPEN', 'SAFETY', 'DEGRADED'],
    domain: 'labor',
  },
  {
    id: 'F01',
    title: 'NIM 超时',
    subtitle: '模型未及时响应',
    expected: '无评估 → 无提案 → 无执行',
    narrative: ['TIMEOUT', 'SAFETY'],
  },
];

// ── Card ──────────────────────────────────────────────────────────────────────

function ScenarioCard({
  scenario,
  selected,
  onSelect,
}: {
  scenario: FaultScenario;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const { id, recommended, title, subtitle, expected, narrative } = scenario;
  const accent = recommended ? '#D29922' : '#484F58';
  const borderColor = selected ? '#1F6FEB' : recommended ? `${accent}55` : '#21262D';

  return (
    <Box
      component="button"
      onClick={() => onSelect(id)}
      data-testid={`fault-scenario-${id}`}
      aria-pressed={selected}
      sx={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: selected ? '#0d2146' : '#161B22',
        border: `1.5px solid ${borderColor}`,
        borderRadius: '6px',
        px: 1.75,
        py: 1.25,
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.1s ease',
        '&:hover': { borderColor: '#388BFD', background: '#0d1930' },
      }}
    >
      {/* Badges */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.58rem', color: '#484F58', letterSpacing: '0.1em' }}>
          {id}
        </Typography>
        {recommended && (
          <Box component="span" sx={{
            fontFamily: 'monospace', fontSize: '0.58rem', fontWeight: 700,
            color: '#D29922', border: '1px solid #D2992244', borderRadius: '3px',
            px: '4px', py: '1px', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}
          data-testid={`fault-scenario-${id}-recommended`}
          >
            ★ 推荐
          </Box>
        )}
      </Box>

      <Typography sx={{
        fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700,
        color: '#C9D1D9', mb: '2px',
      }}>
        {title}
      </Typography>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#6E7681', mb: 0.75 }}>
        {subtitle}
      </Typography>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#484F58', mb: 0.75 }}>
        预期: {expected}
      </Typography>

      {/* Narrative preview */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
        {narrative.map((step, i) => (
          <React.Fragment key={step}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.58rem', color: accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {step}
            </Typography>
            {i < narrative.length - 1 && (
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.58rem', color: '#30363D' }}>→</Typography>
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
}

// ── ReliabilityScenarioSelector ───────────────────────────────────────────────

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ReliabilityScenarioSelector({ selectedId, onSelect }: Props) {
  return (
    <Box data-testid="reliability-scenario-selector">
      <Typography sx={{
        fontFamily: 'monospace', fontSize: '0.58rem', color: '#484F58',
        letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.75,
      }}>
        可靠性场景
      </Typography>
      <Typography sx={{
        fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700,
        color: '#C9D1D9', mb: 1.5,
      }}>
        选择一个可靠性场景
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {FAULT_SCENARIOS.map(s => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            selected={selectedId === s.id}
            onSelect={onSelect}
          />
        ))}
      </Box>
    </Box>
  );
}
