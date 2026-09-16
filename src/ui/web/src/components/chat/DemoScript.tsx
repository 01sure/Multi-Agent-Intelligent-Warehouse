import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

interface DemoScriptProps {
  onScenarioSelect: (scenario: string) => void;
}

const DemoScript: React.FC<DemoScriptProps> = ({ onScenarioSelect }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentFlow, setCurrentFlow] = useState<string | null>(null);

  const demoFlows = [
    {
      id: 'work_order_flow',
      title: '工单 → 波次 → 设备调度',
      description: '运营 + EAO 智能体协作',
      icon: <AssignmentIcon />,
      steps: [
        {
          label: '用户请求',
          description: '用户："为 A 区订单 1001–1010 创建波次，并调度一辆叉车。"',
          expected: '路由 → 运营 (0.88)',
        },
        {
          label: '数据检索',
          description: '检索 → top-12→6；订单明细 SQL（38ms）',
          expected: '证据：订单明细、库区布局',
        },
        {
          label: '提议的行动',
          description: 'generate_pick_wave（展示参数，SLA 收益 + 行驶时间）',
          expected: '带审批/驳回的行动卡片',
        },
        {
          label: '设备分配',
          description: 'assign_equipment(asset_id=FL-07, zone=A)',
          expected: '设备分配卡片',
        },
        {
          label: '用户审批',
          description: '用户点击审批（一级）',
          expected: '成功提示 + 审计 ID',
        },
        {
          label: '结果',
          description: 'WMS 波次 id + 设备分配',
          expected: '带链接的 action_result',
        },
      ],
    },
    {
      id: 'equipment_status_flow',
      title: '设备状态查询与分配',
      description: '设备/SQL 路径，含资产管理',
      icon: <InventoryIcon />,
      steps: [
        {
          label: '用户请求',
          description: '用户："显示所有叉车的状态及其可用情况"',
          expected: '路由：设备 (0.95)',
        },
        {
          label: '设备查询',
          description: '带筛选条件执行设备状态查询',
          expected: 'SQL 检查器显示查询与结果',
        },
        {
          label: '结果表格',
          description: '表格卡片：设备状态明细',
          expected: '含资产详情的结构化数据表',
        },
        {
          label: '分配提案',
          description: '针对可用叉车提议的行动 assign_equipment',
          expected: '带设备参数的行动卡片',
        },
        {
          label: '审批',
          description: '审批 → 含分配详情的 action_result',
          expected: '带资产 ID 的成功确认',
        },
      ],
    },
    {
      id: 'safety_incident_flow',
      title: '安全事件响应',
      description: '安全 + EAO 智能体协作',
      icon: <SecurityIcon />,
      steps: [
        {
          label: '事件上报',
          description: '用户："D2 码头设备超温事件。"',
          expected: '路由：安全 (0.95)',
        },
        {
          label: '提议的行动',
          description: 'broadcast_alert(zone=D2), lockout_tagout_request(asset_id=DL-4), start_checklist(forklift_pre_op)',
          expected: '多张行动卡片',
        },
        {
          label: '用户决策',
          description: '审批前两项；驳回第三项',
          expected: '选择性审批/驳回',
        },
        {
          label: '证据面板',
          description: '策略区间 + 遥测数据行（Timescale）',
          expected: '带来源链接的证据',
        },
        {
          label: '摘要',
          description: '最终消息汇总行动、关联工单与后续步骤',
          expected: '完整的行动摘要',
        },
      ],
    },
  ];

  const handleStepComplete = (stepIndex: number, flowId: string) => {
    if (currentFlow === flowId && !completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
      // Auto-advance to next step if not the last step
      const flow = demoFlows.find(f => f.id === flowId);
      if (flow && stepIndex < flow.steps.length - 1) {
        setActiveStep(stepIndex + 1);
      }
    }
  };

  const handleStepClick = (stepIndex: number, flowId: string) => {
    if (currentFlow === flowId) {
      setActiveStep(stepIndex);
    }
  };

  const handleFlowStart = (flowId: string) => {
    onScenarioSelect(flowId);
    setCurrentFlow(flowId);
    setActiveStep(0);
    setCompletedSteps([]);
  };

  const getStepIcon = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) {
      return <CheckIcon sx={{ color: '#76B900' }} />;
    }
    return <UncheckedIcon sx={{ color: '#666666' }} />;
  };

  return (
    <Box sx={{ p: 2, backgroundColor: 'background.default', height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ color: 'text.primary', mb: 3, textAlign: 'center', fontWeight: 500 }}>
        演示脚本
      </Typography>

      {demoFlows.map((flow, flowIndex) => (
        <Card key={flow.id} sx={{ mb: 3, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ color: 'primary.main', mr: 2 }}>
                {flow.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: 'text.primary', fontSize: '16px', fontWeight: 500 }}>
                  {flow.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {flow.description}
                </Typography>
                {currentFlow === flow.id && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500 }}>
                      进度：已完成 {completedSteps.length} / {flow.steps.length} 步
                    </Typography>
                    <Box sx={{ width: '100%', height: 4, backgroundColor: 'grey.700', borderRadius: 2, mt: 0.5 }}>
                      <Box 
                        sx={{ 
                          width: `${(completedSteps.length / flow.steps.length) * 100}%`, 
                          height: '100%', 
                          backgroundColor: 'primary.main', 
                          borderRadius: 2,
                          transition: 'width 0.3s ease'
                        }} 
                      />
                    </Box>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {currentFlow === flow.id && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setCurrentFlow(null);
                      setActiveStep(0);
                      setCompletedSteps([]);
                    }}
                    sx={{
                      color: '#666666',
                      borderColor: '#e0e0e0',
                      '&:hover': { 
                        backgroundColor: '#f5f5f5',
                        borderColor: '#666666'
                      },
                    }}
                  >
                    重置
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={() => handleFlowStart(flow.id)}
                  sx={{
                    backgroundColor: '#76B900',
                    color: '#ffffff',
                    '&:hover': { backgroundColor: '#5a8f00' },
                  }}
                >
                  {currentFlow === flow.id ? '重新开始' : '开始'}
                </Button>
              </Box>
            </Box>

            <Stepper activeStep={activeStep} orientation="vertical">
              {flow.steps.map((step, stepIndex) => {
                const isCompleted = completedSteps.includes(stepIndex);
                const isActive = currentFlow === flow.id && activeStep === stepIndex;
                const isClickable = currentFlow === flow.id;
                
                return (
                  <Step key={stepIndex}>
                    <StepLabel
                      StepIconComponent={() => getStepIcon(stepIndex)}
                      onClick={() => isClickable && handleStepClick(stepIndex, flow.id)}
                      sx={{
                        cursor: isClickable ? 'pointer' : 'default',
                        '& .MuiStepLabel-label': {
                          color: isActive ? '#76B900' : isCompleted ? '#76B900' : '#333333',
                          fontSize: '14px',
                          fontWeight: isActive ? 'bold' : 'normal',
                        },
                        '&:hover': isClickable ? {
                          '& .MuiStepLabel-label': {
                            color: '#76B900',
                          },
                        } : {},
                      }}
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666666', mb: 1 }}>
                          {step.description}
                        </Typography>
                        <Chip
                          label={step.expected}
                          size="small"
                          sx={{
                            backgroundColor: isCompleted ? '#76B900' : '#e0e0e0',
                            color: isCompleted ? '#ffffff' : '#333333',
                            fontSize: '10px',
                          }}
                        />
                      </Box>
                      {currentFlow === flow.id && (
                        <Button
                          size="small"
                          onClick={() => handleStepComplete(stepIndex, flow.id)}
                          disabled={isCompleted}
                          variant={isCompleted ? "outlined" : "contained"}
                          sx={{
                            backgroundColor: isCompleted ? 'transparent' : '#76B900',
                            color: isCompleted ? '#76B900' : '#000000',
                            borderColor: '#76B900',
                            '&:hover': {
                              backgroundColor: isCompleted ? '#76B900' : '#5a8f00',
                              color: isCompleted ? 'primary.contrastText' : 'text.primary',
                            },
                            '&:disabled': {
                              backgroundColor: 'transparent',
                              color: '#76B900',
                              borderColor: '#76B900',
                            },
                          }}
                        >
                          {isCompleted ? '✓ 已完成' : '标记完成'}
                        </Button>
                      )}
                    </StepContent>
                  </Step>
                );
              })}
            </Stepper>
          </CardContent>
        </Card>
      ))}

      <Card sx={{ backgroundColor: '#fafafa', border: '1px solid #e0e0e0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#333333', mb: 2, fontSize: '16px', fontWeight: 500 }}>
            演示提示
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckIcon sx={{ color: '#76B900', fontSize: '16px' }} />
              </ListItemIcon>
              <ListItemText
                primary="选择 WH-01，角色为管理员"
                primaryTypographyProps={{ fontSize: '12px', color: '#333333' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon sx={{ color: '#76B900', fontSize: '16px' }} />
              </ListItemIcon>
              <ListItemText
                primary="切换“显示内部细节”查看详细视图"
                primaryTypographyProps={{ fontSize: '12px', color: '#333333' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon sx={{ color: '#76B900', fontSize: '16px' }} />
              </ListItemIcon>
              <ListItemText
                primary="在右侧面板查看证据与工具时间线"
                primaryTypographyProps={{ fontSize: '12px', color: '#333333' }}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon sx={{ color: '#76B900', fontSize: '16px' }} />
              </ListItemIcon>
              <ListItemText
                primary="使用快捷回复回答澄清性问题"
                primaryTypographyProps={{ fontSize: '12px', color: '#333333' }}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DemoScript;
