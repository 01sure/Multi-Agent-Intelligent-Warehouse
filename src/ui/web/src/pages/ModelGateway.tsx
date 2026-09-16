import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider,
} from '@mui/material';
import {
  CheckCircle as OkIcon,
  Error as ErrorIcon,
  Psychology as ModelIcon,
} from '@mui/icons-material';
import { useRuntimeStatus } from '../hooks/useRuntimeStatus';

const MODEL_ROLES = [
  { role: 'Lightning', description: '响应最快——对延迟敏感的任务', model: 'Nemotron Lightning', note: '能力最弱，吞吐最高' },
  { role: 'Nano', description: '紧凑高效的推理', model: 'Nemotron Nano', note: '速度与能力的平衡' },
  { role: 'Super', description: '通用仓库推理', model: 'Nemotron Super', note: '大多数评估的默认选择' },
  { role: 'Ultra', description: '复杂的多领域分析', model: 'Nemotron Ultra', note: '能力最强，用于高风险决策' },
];

const AGENT_ROLES = [
  {
    id: 'equipment_agent',
    name: '设备资产运营智能体',
    domain: '设备',
    uses: 'ModelGateway · WarehouseState · 设备技能',
    field: 'equipment_agent_available' as const,
  },
  {
    id: 'operations_agent',
    name: '运营协调智能体',
    domain: '人力 / 波次',
    uses: 'ModelGateway · WarehouseState · 人力 + 波次技能',
    field: 'operations_agent_available' as const,
  },
  {
    id: 'safety_agent',
    name: '安全合规智能体',
    domain: '安全',
    uses: 'ModelGateway · WarehouseState · 安全政策',
    field: 'safety_agent_available' as const,
  },
];

function AvailabilityChip({ available }: { available: boolean | undefined }) {
  if (available === undefined) return <Chip label="未知" size="small" sx={{ backgroundColor: '#21262D', color: '#8B949E' }} />;
  return available
    ? <Chip icon={<OkIcon sx={{ fontSize: '14px !important' }} />} label="可用" size="small" color="success" variant="outlined" />
    : <Chip icon={<ErrorIcon sx={{ fontSize: '14px !important' }} />} label="不可用" size="small" color="error" variant="outlined" />;
}

const ModelGateway: React.FC = () => {
  const { data: runtime, isLoading } = useRuntimeStatus();

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
          模型
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          模型网关路由 · Nemotron 角色注册表 · 推理智能体
        </Typography>
      </Box>

      {/* Gateway availability */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ backgroundColor: 'background.paper' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <ModelIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>ModelGateway</Typography>
              </Box>
              <AvailabilityChip available={runtime?.model_gateway_available} />
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1 }}>
                按角色将任务路由到 Nemotron 模型。所有仓库推理都流经此网关。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ backgroundColor: 'background.paper' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>决策引擎</Typography>
              <AvailabilityChip available={runtime?.decision_engine_available} />
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1 }}>
                评估行动提案，返回 approved / rejected / requires_human_approval / requires_fresh_state。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ backgroundColor: 'background.paper' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>状态提供者</Typography>
              <AvailabilityChip available={runtime?.state_provider_available} />
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1 }}>
                组装仓库状态快照，供智能体和决策引擎进行新鲜度检查。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Nemotron role registry */}
      <Card sx={{ backgroundColor: 'background.paper', mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
            Nemotron 模型注册表 · 角色
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            模型按逻辑角色调用，而非按名称。模型网关在运行时选择合适的模型。角色到模型的映射在 ModelRegistry 中配置（本版本未通过 API 暴露）。
          </Alert>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>角色</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>模型</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>适用场景</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>说明</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {MODEL_ROLES.map(({ role, description, model, note }) => (
                  <TableRow key={role} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' } }}>
                    <TableCell>
                      <Chip label={role} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700, backgroundColor: 'rgba(118,185,0,0.12)', color: 'primary.light', border: '1px solid rgba(118,185,0,0.3)' }} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{model}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{description}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Reasoning agents */}
      <Card sx={{ backgroundColor: 'background.paper' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
            推理智能体 · 决策流水线角色
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            智能体是决策流水线中的推理角色——而非能力的所有者。它们使用模型网关和仓库状态产出行动提案，再流向决策引擎。
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {AGENT_ROLES.map(({ name, domain, uses, field }) => (
              <Grid item xs={12} md={4} key={field}>
                <Box
                  sx={{
                    backgroundColor: '#0D1117',
                    border: '1px solid #21262D',
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{name}</Typography>
                    <AvailabilityChip available={runtime?.[field]} />
                  </Box>
                  <Chip label={domain} size="small" variant="outlined" sx={{ mb: 1, fontSize: '0.7rem' }} />
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                    {uses}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ModelGateway;
