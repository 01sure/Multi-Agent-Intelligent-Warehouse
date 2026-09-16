import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as GreenIcon,
  Warning as AmberIcon,
  Error as RedIcon,
  HelpOutline as UnknownIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useRuntimeStatus } from '../hooks/useRuntimeStatus';
import { healthAPI } from '../services/api';

type HealthStatus = 'green' | 'amber' | 'red' | 'unknown';

interface HealthItem {
  label: string;
  status: HealthStatus;
  detail?: string;
}

function statusIcon(status: HealthStatus) {
  const sz = { fontSize: 20 };
  return {
    green: <GreenIcon sx={{ ...sz, color: '#3FB950' }} />,
    amber: <AmberIcon sx={{ ...sz, color: '#D29922' }} />,
    red: <RedIcon sx={{ ...sz, color: '#F85149' }} />,
    unknown: <UnknownIcon sx={{ ...sz, color: '#484F58' }} />,
  }[status];
}

function boolToStatus(val: boolean | undefined, falseIsRed = true): HealthStatus {
  if (val === undefined) return 'unknown';
  if (val) return 'green';
  return falseIsRed ? 'red' : 'amber';
}

function serviceStatus(svc: any): HealthStatus {
  if (!svc) return 'unknown';
  const s = svc.status ?? svc;
  if (s === 'healthy' || s === 'ok' || s === true) return 'green';
  if (s === 'degraded' || s === 'warning') return 'amber';
  if (s === 'unhealthy' || s === false) return 'red';
  return 'unknown';
}

function HealthCell({ item }: { item: HealthItem }) {
  const borderColor = { green: '#3FB95033', amber: '#D2992233', red: '#F8514933', unknown: '#21262D' }[item.status];
  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Box
        sx={{
          backgroundColor: '#0D1117',
          border: `1px solid ${borderColor}`,
          borderRadius: 2,
          p: 2,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          height: '100%',
        }}
      >
        <Box sx={{ flexShrink: 0, mt: 0.25 }}>{statusIcon(item.status)}</Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}>
            {item.label}
          </Typography>
          {item.detail && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
              {item.detail}
            </Typography>
          )}
        </Box>
      </Box>
    </Grid>
  );
}

const SystemHealth: React.FC = () => {
  const { data: runtime, isLoading: runtimeLoading } = useRuntimeStatus();

  const { data: live, isLoading: liveLoading } = useQuery({
    queryKey: ['live'],
    queryFn: healthAPI.getLive,
    refetchInterval: 15000,
    retry: 0,
    staleTime: 10000,
  });

  const { data: fullHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['full-health'],
    queryFn: healthAPI.getFull,
    refetchInterval: 30000,
    retry: 1,
    staleTime: 20000,
  });

  const isLoading = runtimeLoading || liveLoading || healthLoading;

  const apiStatus: HealthStatus = live === undefined ? 'unknown' : live.status === 'alive' ? 'green' : 'red';
  const dbStatus = serviceStatus(fullHealth?.services?.database);
  const redisStatus = serviceStatus(fullHealth?.services?.redis);
  const milvusStatus = serviceStatus(fullHealth?.services?.milvus);

  const coreItems: HealthItem[] = [
    { label: 'API 进程', status: apiStatus, detail: 'GET /api/v1/live' },
    { label: 'MAIWRuntime', status: boolToStatus(runtime?.runtime_initialized), detail: 'runtime_initialized' },
    { label: '模型网关', status: boolToStatus(runtime?.model_gateway_available), detail: 'model_gateway_available' },
    { label: '决策引擎', status: boolToStatus(runtime?.decision_engine_available), detail: 'decision_engine_available' },
    { label: '状态提供者', status: boolToStatus(runtime?.state_provider_available, false), detail: 'state_provider_available' },
  ];

  const mcpItems: HealthItem[] = [
    { label: 'MCP 库存', status: boolToStatus(runtime?.inventory_mcp_configured, false), detail: ':8765 · streamable-http' },
    { label: 'MCP 设备', status: boolToStatus(runtime?.equipment_mcp_configured, false), detail: ':8766 · streamable-http' },
    { label: 'MCP 人力', status: boolToStatus(runtime?.labor_mcp_configured, false), detail: ':8767 · streamable-http' },
    { label: 'MCP 波次', status: boolToStatus(runtime?.wave_mcp_configured, false), detail: ':8768 · streamable-http' },
  ];

  const agentItems: HealthItem[] = [
    { label: '设备智能体', status: boolToStatus(runtime?.equipment_agent_available, false), detail: '设备资产运营' },
    { label: '运营智能体', status: boolToStatus(runtime?.operations_agent_available, false), detail: '运营协调' },
    { label: '安全智能体', status: boolToStatus(runtime?.safety_agent_available, false), detail: '安全合规' },
    { label: '设备执行器', status: boolToStatus(runtime?.equipment_executor_available, false), detail: 'ActionExecutor · equipment' },
    { label: '人力执行器', status: boolToStatus(runtime?.labor_executor_available, false), detail: 'ActionExecutor · labor' },
    { label: '波次执行器', status: boolToStatus(runtime?.wave_executor_available, false), detail: 'ActionExecutor · wave' },
  ];

  const infraItems: HealthItem[] = [
    { label: '数据库', status: dbStatus, detail: fullHealth?.services?.database?.message ?? 'TimescaleDB / PostgreSQL' },
    { label: 'Redis', status: redisStatus, detail: fullHealth?.services?.redis?.message ?? '缓存 / 会话存储' },
    { label: 'Milvus', status: milvusStatus, detail: fullHealth?.services?.milvus?.message ?? '向量数据库' },
  ];

  function Section({ title, items }: { title: string; items: HealthItem[] }) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
          {title}
        </Typography>
        <Grid container spacing={1.5}>
          {items.map((item) => <HealthCell key={item.label} item={item} />)}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
            系统健康
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            全部组件状态 · 每 15–30 秒自动刷新
          </Typography>
        </Box>
        {isLoading && <CircularProgress size={20} sx={{ mt: 0.5 }} />}
      </Box>

      {/* Status legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {([['green', '健康'], ['amber', '降级'], ['red', '不可用'], ['unknown', '未知']] as [HealthStatus, string][]).map(([s, label]) => (
          <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {statusIcon(s)}
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
          </Box>
        ))}
      </Box>

      <Section title="核心流水线" items={coreItems} />
      <Section title="MCP 领域服务" items={mcpItems} />
      <Section title="推理智能体与执行器" items={agentItems} />
      <Section title="基础设施" items={infraItems} />

      <Typography variant="caption" sx={{ color: '#484F58', display: 'block', mt: 2 }}>
        琥珀色 = 已配置但非核心功能必需 · 红色 = 预期可用却不可用 · 此处并非完整监控平台——告警请使用 Grafana。
      </Typography>
    </Box>
  );
};

export default SystemHealth;
