import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle as OkIcon,
  Error as ErrorIcon,
  Visibility as ReadIcon,
  Send as ProposalIcon,
  PlayArrow as ExecutionIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useRuntimeStatus } from '../hooks/useRuntimeStatus';
import { mcpAPI } from '../services/api';

interface CapabilityInfo {
  domain: string;
  name: string;
  type: 'READ' | 'PROPOSAL' | 'EXECUTION';
  description: string;
  risk?: string;
}

const KNOWN_CAPABILITIES: CapabilityInfo[] = [
  { domain: 'inventory', name: 'warehouse.inventory.get', type: 'READ', description: '读取库存水位与 SKU 数据' },
  { domain: 'inventory', name: 'warehouse.inventory.locate', type: 'READ', description: '按区域或 SKU 定位库存商品' },
  { domain: 'equipment', name: 'warehouse.equipment.get', type: 'READ', description: '读取设备资产状态与遥测数据' },
  { domain: 'equipment', name: 'warehouse.equipment.assign', type: 'EXECUTION', description: '将设备分配给用户或任务', risk: 'medium' },
  { domain: 'equipment', name: 'warehouse.equipment.release', type: 'EXECUTION', description: '释放设备分配', risk: 'low' },
  { domain: 'equipment', name: 'warehouse.equipment.maintenance', type: 'PROPOSAL', description: '排程保养——触发决策引擎', risk: 'low' },
  { domain: 'equipment', name: 'warehouse.equipment.status', type: 'READ', description: '读取设备当前运行状态' },
  { domain: 'labor', name: 'warehouse.labor.workforce', type: 'READ', description: '读取人力与班次状态' },
  { domain: 'labor', name: 'warehouse.labor.assign_task', type: 'EXECUTION', description: '将任务分配给作业人员', risk: 'low' },
  { domain: 'labor', name: 'warehouse.labor.schedule', type: 'PROPOSAL', description: '提议班次计划变更', risk: 'medium' },
  { domain: 'wave', name: 'warehouse.wave.status', type: 'READ', description: '读取波次规划与履约状态' },
  { domain: 'wave', name: 'warehouse.wave.reprioritize', type: 'PROPOSAL', description: '提议波次重新排序', risk: 'high' },
  { domain: 'wave', name: 'warehouse.wave.close', type: 'EXECUTION', description: '关闭已完成的波次', risk: 'medium' },
];

const TYPE_CONFIG = {
  READ: { color: '#58A6FF', icon: <ReadIcon sx={{ fontSize: 12 }} />, label: 'READ' },
  PROPOSAL: { color: '#D29922', icon: <ProposalIcon sx={{ fontSize: 12 }} />, label: 'PROPOSAL' },
  EXECUTION: { color: '#3FB950', icon: <ExecutionIcon sx={{ fontSize: 12 }} />, label: 'EXECUTION' },
};

const RISK_CONFIG: Record<string, { color: 'success' | 'warning' | 'error' | 'default' }> = {
  low: { color: 'success' },
  medium: { color: 'warning' },
  high: { color: 'error' },
};

function TypeBadge({ type }: { type: 'READ' | 'PROPOSAL' | 'EXECUTION' }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <Chip
      icon={cfg.icon as any}
      label={cfg.label}
      size="small"
      sx={{
        backgroundColor: `${cfg.color}1A`,
        color: cfg.color,
        border: `1px solid ${cfg.color}4D`,
        fontFamily: 'monospace',
        fontWeight: 700,
        fontSize: '0.65rem',
        letterSpacing: '0.04em',
        height: 22,
      }}
    />
  );
}

const DOMAINS = [
  { id: 'inventory', label: '库存', portLabel: '8765', configuredField: 'inventory_mcp_configured' as const },
  { id: 'equipment', label: '设备', portLabel: '8766', configuredField: 'equipment_mcp_configured' as const },
  { id: 'labor', label: '人力', portLabel: '8767', configuredField: 'labor_mcp_configured' as const },
  { id: 'wave', label: '波次', portLabel: '8768', configuredField: 'wave_mcp_configured' as const },
];

const CapabilityPlane: React.FC = () => {
  const { data: runtime } = useRuntimeStatus();
  const { data: mcpStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['mcp-status'],
    queryFn: mcpAPI.getStatus,
    staleTime: 30000,
  });
  const { data: mcpCapabilities, isLoading: capsLoading } = useQuery({
    queryKey: ['mcp-capabilities'],
    queryFn: mcpAPI.getCapabilities,
    staleTime: 60000,
    retry: 1,
  });

  const isLoading = statusLoading || capsLoading;

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
          能力平面
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          MCP v2 领域服务 · Streamable HTTP · 无状态
        </Typography>
      </Box>

      {/* Type legend */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <TypeBadge type="READ" />
        <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>读取状态——不执行任何操作</Typography>
        <Divider orientation="vertical" flexItem />
        <TypeBadge type="PROPOSAL" />
        <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>提议行动——经决策引擎路由</Typography>
        <Divider orientation="vertical" flexItem />
        <TypeBadge type="EXECUTION" />
        <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>通过执行器直接执行</Typography>
      </Box>

      {/* Domain status cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {DOMAINS.map(({ id, label, portLabel, configuredField }) => {
          const configured = runtime?.[configuredField];
          const domainStatus = mcpStatus?.domains?.[id];
          return (
            <Grid item xs={12} sm={6} md={3} key={id}>
              <Card sx={{
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: configured ? 'rgba(63,185,80,0.3)' : '#21262D',
              }}>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>
                      {label}
                    </Typography>
                    {configured ? (
                      <OkIcon sx={{ color: 'success.main', fontSize: 18 }} />
                    ) : (
                      <ErrorIcon sx={{ color: 'error.main', fontSize: 18 }} />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', display: 'block' }}>
                    :{portLabel} · streamable-http
                  </Typography>
                  {domainStatus && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {domainStatus.tool_count ?? 0} 个工具已发现
                    </Typography>
                  )}
                  <Chip
                    label={configured ? '已配置' : '未配置'}
                    size="small"
                    color={configured ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ mt: 1, fontSize: '0.65rem', height: 20 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Constraints notice */}
      <Alert severity="info" sx={{ mb: 3 }}>
        前端仅调用 <code>apps/api</code> 端点——绝不直接调用 MCP 服务。MCP 服务由 API 进程内的执行器调用。
      </Alert>

      {/* Capability matrix */}
      <Card sx={{ backgroundColor: 'background.paper', mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
            能力矩阵 · 已知技能
          </Typography>
          {isLoading ? (
            <CircularProgress size={24} sx={{ m: 2 }} />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 100 }}>领域</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>能力</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120 }}>类型</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>描述</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 90 }}>风险</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {KNOWN_CAPABILITIES.map((cap) => (
                    <TableRow
                      key={cap.name}
                      sx={{
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' },
                        opacity: runtime?.[`${cap.domain}_mcp_configured` as keyof typeof runtime] === false ? 0.4 : 1,
                      }}
                    >
                      <TableCell>
                        <Chip label={cap.domain} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20, textTransform: 'uppercase' }} />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#8B949E' }}>{cap.name}</TableCell>
                      <TableCell><TypeBadge type={cap.type} /></TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{cap.description}</TableCell>
                      <TableCell>
                        {cap.risk ? (
                          <Chip label={cap.risk} size="small" color={RISK_CONFIG[cap.risk]?.color ?? 'default'} variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                        ) : (
                          <Typography variant="caption" sx={{ color: '#484F58' }}>—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Live capabilities from API */}
      {mcpCapabilities && (
        <Card sx={{ backgroundColor: 'background.paper' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
              API 实时能力
            </Typography>
            <Box
              component="pre"
              sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#8B949E', backgroundColor: '#0D1117', p: 2, borderRadius: 1, overflow: 'auto', maxHeight: 300 }}
            >
              {JSON.stringify(mcpCapabilities, null, 2)}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CapabilityPlane;
