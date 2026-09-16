/**
 * FaultInjectionPanel — inject fault events and trigger reconciliation.
 *
 * Inject buttons map fault scenarios to available /demo/inject event types.
 * Reconcile button calls /demo/reconcile for any pending UNKNOWN execution.
 *
 * Available inject types (from InjectEventType):
 *   equipment_fault, equipment_restore, low_stock, worker_absence,
 *   worker_return, task_deadline, wave_delay
 *
 * F06/F10 use equipment_fault as proxy (backend fault injection logic handles ambiguous write).
 * F12/F01 have no direct inject — operator notes walk through manual steps.
 */

import React, { useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { demoAPI } from '../../../services/demoAPI';
import { SSEEvent, parseEventDetail } from '../../../hooks/useDemoSSE';

interface Props {
  scenarioId: string | null;
  sseEvents: SSEEvent[];
}

interface InjectionConfig {
  label: string;
  description: string;
  action: () => Promise<void>;
  color?: string;
  testId: string;
}

function ActionButton({
  label,
  description,
  onClick,
  disabled,
  loading,
  color,
  testId,
}: {
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
  testId: string;
}) {
  const borderColor = color ?? '#30363D';
  return (
    <Box
      component="button"
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testId}
      sx={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: disabled ? '#0D1117' : '#161B22',
        border: `1px solid ${disabled ? '#21262D' : borderColor}`,
        borderRadius: '4px',
        px: 1.5, py: 1,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        '&:hover:not(:disabled)': { borderColor: '#388BFD', background: '#0d1930' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {loading && <CircularProgress size={10} sx={{ color: '#58A6FF', flexShrink: 0 }} />}
        <Typography sx={{
          fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700,
          color: disabled ? '#484F58' : (color ?? '#C9D1D9'),
          letterSpacing: '0.04em',
        }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#484F58', mt: '2px' }}>
        {description}
      </Typography>
    </Box>
  );
}

export default function FaultInjectionPanel({ scenarioId, sseEvents }: Props) {
  const [injectLoading, setInjectLoading] = useState(false);
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Find an UNKNOWN execution pending reconciliation from SSE
  const unknownEvent = sseEvents.find(e => e.category === 'RECONCILIATION_REQUIRED');
  const unknownDetail = unknownEvent ? parseEventDetail(unknownEvent) : null;
  const executionId = unknownDetail?.execution_id ?? unknownEvent?.execution_id ?? null;
  const domain = unknownDetail?.domain ?? unknownEvent?.domain ?? 'equipment';

  const handleInject = async (fn: () => Promise<any>, label: string) => {
    if (injectLoading) return;
    setInjectLoading(true);
    setLastResult(null);
    try {
      await fn();
      setLastResult(`${label} → 已注入`);
    } catch (e: any) {
      setLastResult(`错误: ${e?.response?.data?.detail ?? e?.message ?? 'unknown'}`);
    } finally {
      setInjectLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!executionId || reconcileLoading) return;
    setReconcileLoading(true);
    setLastResult(null);
    try {
      await demoAPI.reconcile(executionId, domain);
      setLastResult(`已派发对账: ${executionId}`);
    } catch (e: any) {
      setLastResult(`对账错误: ${e?.response?.data?.detail ?? e?.message ?? 'unknown'}`);
    } finally {
      setReconcileLoading(false);
    }
  };

  const scenarioConfigs: Record<string, InjectionConfig[]> = {
    F06: [
      {
        label: '注入故障',
        description: '触发设备故障 → 进入模糊写入路径',
        action: () => demoAPI.inject('equipment_fault', { asset_id: 'AGV-01', simulate_ambiguous_write: true }),
        color: '#D29922',
        testId: 'inject-fault-F06',
      },
    ],
    F07: [
      {
        label: '触发重复审批',
        description: '通过独立调用对同一 pending_id 快速发起 3 次审批',
        action: async () => {
          const pending = await demoAPI.getStatus().then(s => s.pending_approvals?.[0]);
          if (!pending) throw new Error('没有待处理审批——请先运行观察');
          await Promise.allSettled([
            demoAPI.approvePending(pending.pending_id, 'op-1'),
            demoAPI.approvePending(pending.pending_id, 'op-2'),
            demoAPI.approvePending(pending.pending_id, 'op-3'),
          ]);
        },
        color: '#D29922',
        testId: 'inject-fault-F07',
      },
    ],
    F10: [
      {
        label: '注入状态漂移',
        description: '注入设备故障后恢复 → 提案窗口期内状态变化',
        action: async () => {
          await demoAPI.inject('equipment_fault', { asset_id: 'AGV-01' });
          await demoAPI.inject('equipment_restore', { asset_id: 'AGV-01' });
        },
        color: '#D29922',
        testId: 'inject-fault-F10',
      },
    ],
    F12: [
      {
        label: '注入缺勤',
        description: '模拟人力域压力 → worker_absence 突发',
        action: () => demoAPI.inject('worker_absence', { worker_id: 'w-003' }),
        color: '#D29922',
        testId: 'inject-fault-F12',
      },
    ],
    F01: [
      {
        label: '注入任务截止',
        description: '强制紧急任务——容量打满时触发 NIM 超时路径',
        action: () => demoAPI.inject('task_deadline', { task_id: 'task-001', deadline: '2026-08-23T10:00:00Z' }),
        color: '#D29922',
        testId: 'inject-fault-F01',
      },
    ],
  };

  const actions = scenarioId ? (scenarioConfigs[scenarioId] ?? []) : [];
  const canReconcile = !!executionId;

  return (
    <Box data-testid="fault-injection-panel" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{
        fontFamily: 'monospace', fontSize: '0.58rem', color: '#484F58',
        letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5,
      }}>
        故障控制
      </Typography>

      {scenarioId ? (
        <>
          {actions.map(cfg => (
            <ActionButton
              key={cfg.testId}
              label={cfg.label}
              description={cfg.description}
              onClick={() => handleInject(cfg.action, cfg.label)}
              disabled={false}
              loading={injectLoading}
              color={cfg.color}
              testId={cfg.testId}
            />
          ))}

          {/* Reconcile button — always shown; disabled until RECONCILIATION_REQUIRED fires */}
          <ActionButton
            label="立即对账"
            description={canReconcile
              ? `为执行 ${executionId} 解决 UNKNOWN`
              : '等待 RECONCILIATION_REQUIRED 事件...'}
            onClick={handleReconcile}
            disabled={!canReconcile}
            loading={reconcileLoading}
            color="#3FB950"
            testId="reconcile-button"
          />
        </>
      ) : (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#484F58' }}>
          选择一个场景以查看故障控制。
        </Typography>
      )}

      {lastResult && (
        <Box data-testid="inject-result" sx={{ mt: 0.5 }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#8B949E' }}>
            {lastResult}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
