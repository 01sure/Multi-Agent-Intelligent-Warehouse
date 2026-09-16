import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Alert,
  AlertTitle,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Architecture as ArchitectureIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  BugReport as BugReportIcon,
  Rocket as RocketIcon,
  School as SchoolIcon,
  GitHub as GitHubIcon,
  Article as ArticleIcon,
  Build as BuildIcon,
  Api as ApiIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

// Component to display architecture diagram with fallback
const ArchitectureDiagramDisplay: React.FC = () => {
  const navigate = useNavigate();
  const [imageError, setImageError] = React.useState(false);

  if (imageError) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <ArchitectureIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          架构图
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          如需显示架构图，请将图片文件添加到：
        </Typography>
        <Paper sx={{ 
          p: 2, 
          mb: 2, 
          backgroundColor: 'background.default', 
          fontFamily: 'monospace', 
          fontSize: '0.875rem',
          border: '1px solid',
          borderColor: 'divider',
          color: 'text.primary'
        }}>
          src/ui/web/public/architecture-diagram.png
        </Paper>
        <Button 
          variant="outlined" 
          startIcon={<ArchitectureIcon />}
          onClick={() => navigate('/documentation/architecture')}
          sx={{ mt: 1 }}
        >
          查看架构详情
        </Button>
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src="/architecture-diagram.png"
      alt="Multi-Agent-Intelligent-Warehouse System Architecture"
      onError={() => setImageError(true)}
      sx={{
        maxWidth: '100%',
        height: 'auto',
        borderRadius: 1,
        boxShadow: 3,
        cursor: 'pointer',
        '&:hover': {
          opacity: 0.9,
        },
      }}
      onClick={() => navigate('/documentation/architecture')}
    />
  );
};

const Documentation: React.FC = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | false>('overview');

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const quickStartSteps = [
    {
      step: 1,
      title: "环境搭建",
      description: "设置 Python 虚拟环境并安装依赖",
      code: "python -m venv env && source env/bin/activate && pip install -r requirements.txt"
    },
    {
      step: 2,
      title: "数据库配置",
      description: "配置 PostgreSQL/TimescaleDB 与 Milvus 连接",
      code: "cp .env.example .env\n# 在 .env 中编辑数据库凭据"
    },
    {
      step: 3,
      title: "NVIDIA NIMs 设置",
      description: "为 LLM 与嵌入配置 NVIDIA API 密钥",
      code: "export NVIDIA_API_KEY=your_api_key\n# 或添加到 .env 文件"
    },
    {
      step: 4,
      title: "启动服务",
      description: "启动应用技术栈",
      code: "./scripts/setup/dev_up.sh && ./scripts/start_server.sh"
    },
    {
      step: 5,
      title: "Jupyter Notebook 设置（推荐）",
      description: "使用交互式设置指南进行分步设置",
      code: "jupyter notebook notebooks/setup/complete_setup_guide.ipynb"
    }
  ];

  const architectureComponents = [
    {
      name: "多智能体系统",
      description: "规划器/路由器 + 5 个专用智能体（设备、运营、安全、预测、文档）",
      status: "✅ 生产可用",
      icon: <ArchitectureIcon />
    },
    {
      name: "NVIDIA NIMs 集成",
      description: "Nemotron 3 Super 120B + llama-nemotron-embed-vl-1b-v2 嵌入",
      status: "✅ 完全运行",
      icon: <CloudIcon />
    },
    {
      name: "MCP 框架",
      description: "Model Context Protocol，支持动态工具发现与执行",
      status: "✅ 生产可用",
      icon: <BuildIcon />
    },
    {
      name: "聊天界面",
      description: "通过缓存、去重、语义路由与性能监控进行优化",
      status: "✅ 完全优化（2024 年 12 月）",
      icon: <SpeedIcon />
    },
    {
      name: "参数校验",
      description: "带业务规则与警告的全面校验",
      status: "✅ 已实现",
      icon: <SecurityIcon />
    },
    {
      name: "混合 RAG 系统",
      description: "PostgreSQL/TimescaleDB + Milvus 向量检索",
      status: "✅ 已优化",
      icon: <StorageIcon />
    },
    {
      name: "高级推理",
      description: "5 种推理类型，带置信度评分",
      status: "✅ 已实现",
      icon: <SpeedIcon />
    },
    {
      name: "文档处理",
      description: "6 阶段 NVIDIA NeMo 流水线，使用 Nemotron Nano VL 视觉模型",
      status: "✅ 生产可用",
      icon: <ArticleIcon />
    },
    {
      name: "需求预测",
      description: "AI 驱动的预测，含 6 个 ML 模型与 NVIDIA RAPIDS GPU 加速",
      status: "✅ 生产可用",
      icon: <SpeedIcon />
    },
    {
      name: "NeMo Guardrails",
      description: "面向 LLM 输入/输出的内容安全、安全与合规保护",
      status: "✅ 生产可用",
      icon: <SecurityIcon />
    },
    {
      name: "安全与 RBAC",
      description: "JWT 认证，含 5 种用户角色",
      status: "✅ 生产可用",
      icon: <SecurityIcon />
    }
  ];

  const apiEndpoints = [
    {
      category: "核心聊天",
      endpoints: [
        { method: "POST", path: "/api/v1/chat", description: "主聊天界面，带智能体路由、缓存与去重" },
        { method: "POST", path: "/api/v1/chat/conversation/summary", description: "获取会话摘要" },
        { method: "POST", path: "/api/v1/chat/conversation/search", description: "搜索会话历史" },
        { method: "DELETE", path: "/api/v1/chat/conversation/{session_id}", description: "清空会话历史" },
        { method: "POST", path: "/api/v1/chat/validate", description: "校验聊天响应" },
        { method: "GET", path: "/api/v1/chat/conversation/stats", description: "获取会话统计" },
        { method: "GET", path: "/api/v1/health", description: "系统健康检查" },
        { method: "GET", path: "/api/v1/health/simple", description: "简单健康检查" },
        { method: "GET", path: "/api/v1/ready", description: "就绪探针" },
        { method: "GET", path: "/api/v1/live", description: "存活探针" },
        { method: "GET", path: "/api/v1/version", description: "系统版本信息" }
      ]
    },
    {
      category: "智能体运营",
      endpoints: [
        { method: "GET", path: "/api/v1/equipment", description: "获取所有设备资产" },
        { method: "GET", path: "/api/v1/equipment/{asset_id}", description: "按 ID 获取设备" },
        { method: "GET", path: "/api/v1/equipment/assignments", description: "获取设备分配" },
        { method: "GET", path: "/api/v1/equipment/{asset_id}/telemetry", description: "获取设备遥测数据" },
        { method: "POST", path: "/api/v1/equipment/assign", description: "分配设备" },
        { method: "POST", path: "/api/v1/equipment/release", description: "释放设备" },
        { method: "GET", path: "/api/v1/safety/incidents", description: "获取安全事件" },
        { method: "POST", path: "/api/v1/safety/incidents", description: "创建安全事件" },
        { method: "GET", path: "/api/v1/safety/policies", description: "获取安全政策" }
      ]
    },
    {
      category: "MCP 框架",
      endpoints: [
        { method: "GET", path: "/api/v1/mcp/tools", description: "发现可用工具" },
        { method: "POST", path: "/api/v1/mcp/tools/search", description: "按查询搜索工具" },
        { method: "POST", path: "/api/v1/mcp/tools/execute", description: "执行特定工具（注意：端点为 /tools/execute）" },
        { method: "GET", path: "/api/v1/mcp/status", description: "MCP 系统状态" },
        { method: "POST", path: "/api/v1/mcp/test-workflow", description: "测试 MCP 工作流执行" },
        { method: "GET", path: "/api/v1/mcp/agents", description: "列出 MCP 智能体" },
        { method: "POST", path: "/api/v1/mcp/discovery/refresh", description: "刷新工具发现" }
      ]
    },
    {
      category: "文档处理",
      endpoints: [
        { method: "POST", path: "/api/v1/document/upload", description: "上传文档以进行处理" },
        { method: "GET", path: "/api/v1/document/status/{document_id}", description: "获取处理状态" },
        { method: "GET", path: "/api/v1/document/results/{document_id}", description: "获取抽取结果" },
        { method: "POST", path: "/api/v1/document/search", description: "搜索文档" },
        { method: "POST", path: "/api/v1/document/validate/{document_id}", description: "校验文档抽取" },
        { method: "POST", path: "/api/v1/document/approve/{document_id}", description: "批准文档" },
        { method: "POST", path: "/api/v1/document/reject/{document_id}", description: "驳回文档" },
        { method: "GET", path: "/api/v1/document/analytics", description: "文档处理分析" }
      ]
    },
    {
      category: "推理引擎",
      endpoints: [
        { method: "POST", path: "/api/v1/reasoning/analyze", description: "深度推理分析" },
        { method: "GET", path: "/api/v1/reasoning/types", description: "可用推理类型" },
        { method: "GET", path: "/api/v1/reasoning/insights/{session_id}", description: "获取会话的推理洞察" },
        { method: "POST", path: "/api/v1/reasoning/chat-with-reasoning", description: "带推理的聊天" }
      ]
    },
    {
      category: "需求预测",
      endpoints: [
        { method: "GET", path: "/api/v1/forecasting/dashboard", description: "预测仪表盘与分析" },
        { method: "POST", path: "/api/v1/forecasting/real-time", description: "实时需求预测" },
        { method: "GET", path: "/api/v1/forecasting/reorder-recommendations", description: "AI 驱动的补货建议" },
        { method: "GET", path: "/api/v1/forecasting/model-performance", description: "模型性能指标" },
        { method: "GET", path: "/api/v1/forecasting/business-intelligence", description: "商业智能仪表盘" },
        { method: "GET", path: "/api/v1/forecasting/business-intelligence/enhanced", description: "增强版商业智能仪表盘" },
        { method: "POST", path: "/api/v1/forecasting/batch-forecast", description: "多 SKU 批量预测" }
      ]
    },
    {
      category: "训练",
      endpoints: [
        { method: "POST", path: "/api/v1/training/start", description: "启动模型训练" },
        { method: "GET", path: "/api/v1/training/status", description: "获取训练状态" },
        { method: "POST", path: "/api/v1/training/stop", description: "停止训练" },
        { method: "GET", path: "/api/v1/training/history", description: "训练历史" },
        { method: "POST", path: "/api/v1/training/schedule", description: "排程训练" },
        { method: "GET", path: "/api/v1/training/logs", description: "获取训练日志" }
      ]
    }
  ];

  const toolsOverview = [
    {
      agent: "设备与资产运营",
      count: 8,
      tools: ["check_stock", "reserve_inventory", "create_replenishment_task", "generate_purchase_requisition", "adjust_reorder_point", "recommend_reslotting", "start_cycle_count", "investigate_discrepancy"]
    },
    {
      agent: "运营协调",
      count: 8,
      tools: ["assign_tasks", "rebalance_workload", "generate_pick_wave", "optimize_pick_paths", "manage_shift_schedule", "dock_scheduling", "dispatch_equipment", "publish_kpis"]
    },
    {
      agent: "安全与合规",
      count: 7,
      tools: ["log_incident", "start_checklist", "broadcast_alert", "lockout_tagout_request", "create_corrective_action", "retrieve_sds", "near_miss_capture"]
    },
    {
      agent: "需求预测智能体",
      count: 6,
      tools: ["get_forecast", "get_batch_forecast", "get_reorder_recommendations", "get_model_performance", "get_business_intelligence", "get_forecast_dashboard"]
    },
    {
      agent: "文档处理",
      count: 4,
      tools: ["upload_document", "get_document_status", "get_document_results", "get_document_analytics"]
    }
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Multi-Agent-Intelligent-Warehouse
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
          开发者指南与实现文档
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          为开发者提供的完整指南，帮助将这套与 NVIDIA Blueprint 对齐的 Multi-Agent-Intelligent-Warehouse 提升到新水平。
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Chip label="生产可用" color="success" />
          <Chip label="NVIDIA NIMs" color="primary" />
          <Chip label="MCP 框架" color="secondary" />
          <Chip label="5 个智能体" color="info" />
          <Chip label="混合 RAG" color="warning" />
          <Chip label="NeMo Guardrails" color="error" />
          <Chip label="GPU 加速" color="success" />
        </Box>
      </Box>

      {/* Quick Start Alert */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <AlertTitle>🚀 快速开始</AlertTitle>
        本系统已生产可用并具备完整文档。按照下方快速开始指南，几分钟内即可运行起来。
      </Alert>

      {/* Quick Start Section */}
      <Accordion expanded={expandedSection === 'overview'} onChange={handleChange('overview')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RocketIcon color="primary" />
            快速开始指南
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {quickStartSteps.map((step) => (
              <Grid item xs={12} md={step.step === 5 ? 12 : 6} key={step.step}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Step {step.step}: {step.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {step.description}
                    </Typography>
                    <Paper sx={{ 
                      p: 2, 
                      backgroundColor: 'background.default', 
                      fontFamily: 'monospace', 
                      fontSize: '0.875rem',
                      border: '1px solid',
                      borderColor: 'divider',
                      color: 'text.primary',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {step.code}
                    </Paper>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Architecture Overview */}
      <Accordion expanded={expandedSection === 'architecture'} onChange={handleChange('architecture')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArchitectureIcon color="primary" />
            系统架构
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              🏗️ 完整系统架构图
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Multi-Agent-Intelligent-Warehouse 运营助手系统架构，展示所有主要组件、数据流与集成。
              该图展示了从用户交互到 AI 服务、智能体编排、数据处理流水线与存储层的完整系统。
            </Typography>
            
            {/* Architecture Diagram */}
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                mb: 3, 
                textAlign: 'center',
                bgcolor: 'grey.50',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2
              }}
            >
              <ArchitectureDiagramDisplay />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                完整系统架构，展示用户界面、AI 服务、智能体编排、
                文档处理流水线、预测系统、混合 RAG 与数据存储层
              </Typography>
            </Paper>

            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>📋 架构组件</AlertTitle>
              <Typography variant="body2">
                上图展示了完整系统架构，包括：
              </Typography>
              <List dense sx={{ mt: 1 }}>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText 
                    primary="用户交互层" 
                    secondary="前端（端口 3001）、API 网关（端口 8001）、安全（JWT、RBAC）、MCP 集成层"
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText 
                    primary="AI 服务 - NVIDIA NIMs" 
                    secondary="LLM NIM（Nemotron 3 Super 120B）、VL NIM（Nemotron Nano VL）、Embed NIM（llama-nemotron-embed-vl-1b-v2）、NeMo Guardrails"
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText 
                    primary="智能体编排" 
                    secondary="规划智能体、通用智能体、安全智能体、文档抽取智能体、预测智能体、设备智能体、运营智能体、记忆管理器"
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText 
                    primary="6 阶段 NeMo 文档处理流水线" 
                    secondary="NeMo Retriever、智能 OCR、小模型 LLM、嵌入与索引、LLM 评审、路由"
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText 
                    primary="预测系统" 
                    secondary="预测服务（多模型集成）、ML 模型（XGBoost、随机森林、SVR）、商业智能、训练流水线（第 1-3 阶段 RAPIDS）、补货建议"
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText 
                    primary="混合 RAG" 
                    secondary="cuVS Milvus（向量检索）、结构化检索（PostgreSQL/TimescaleDB）、混合排序器"
                  />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemText 
                    primary="数据存储" 
                    secondary="PostgreSQL/TimescaleDB、Redis（缓存会话）、Milvus DB、MiniIO"
                  />
                </ListItem>
              </List>
            </Alert>

            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                startIcon={<ArchitectureIcon />}
                onClick={() => navigate('/documentation/architecture')}
                size="large"
              >
                查看详细架构图
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            组件详情
          </Typography>
          <Grid container spacing={3}>
            {architectureComponents.map((component, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      {component.icon}
                      <Typography variant="h6">{component.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {component.description}
                    </Typography>
                    <Chip 
                      label={component.status} 
                      color={component.status.includes('✅') ? 'success' : 'warning'}
                      size="small"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Document Processing Pipeline */}
      <Accordion expanded={expandedSection === 'document-processing'} onChange={handleChange('document-processing')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleIcon color="primary" />
            文档处理流水线
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              📄 6 阶段 NVIDIA NeMo 文档处理流水线
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              系统使用 NVIDIA NeMo 模型实现全面的文档处理流水线，用于仓库文档理解，
              从 PDF 分解到基于质量评分的智能路由。
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    阶段 1：文档预处理
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>模型：</strong>NeMo Retriever（NVIDIA NeMo）
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    PDF 分解与图像抽取，带版面感知处理，以获得最佳文档结构理解。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    阶段 2：智能 OCR
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>模型：</strong>NeMoRetriever-OCR-v1 + Nemotron Parse
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    快速、准确的文本抽取，带版面感知，保留空间关系与文档结构。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%', bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    阶段 3：小模型 LLM 处理 ⭐
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>模型：</strong>Nemotron Nano VL（通过 NEMOTRON_OMNI_API_KEY 在运行时配置）
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>特性：</strong>
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0 }}>
                      <ListItemText primary="原生视觉理解" />
                    </ListItem>
                    <ListItem sx={{ py: 0 }}>
                      <ListItemText primary="文档理解领域 OCRBench v2 领先" />
                    </ListItem>
                    <ListItem sx={{ py: 0 }}>
                      <ListItemText primary="专为发票/收据/提单（BOL）处理而设计" />
                    </ListItem>
                    <ListItem sx={{ py: 0 }}>
                      <ListItemText primary="推理快速（约 100-200ms）" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    阶段 4：嵌入与索引
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>模型：</strong>llama-nemotron-embed-vl-1b-v2（NVIDIA NeMo）
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    生成向量嵌入，用于语义搜索与智能文档索引，带 GPU 加速。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    阶段 5：大模型评审（LLM as a Judge）
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>模型：</strong>Nemotron 3 Super 120B NIM
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    全面质量校验，含 4 项评估标准：完整性、准确性、合规性与质量评分。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    阶段 6：智能路由
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>系统：</strong>基于质量的路由决策
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    基于质量评分与业务规则的智能路由，决定文档处理工作流与后续操作。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              🔧 技术实现细节
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>API 集成</Typography>
                    <Typography variant="body2">NVIDIA NIMs API，开发时自动回退到模拟实现</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>错误处理</Typography>
                    <Typography variant="body2">优雅降级，带全面的错误恢复与重试机制</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>性能</Typography>
                    <Typography variant="body2">针对仓库文档类型优化，处理快速且准确率高</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* NeMo Guardrails */}
      <Accordion expanded={expandedSection === 'guardrails'} onChange={handleChange('guardrails')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon color="primary" />
            NeMo Guardrails
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              🛡️ 内容安全与合规保护
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              系统实现 <strong>NVIDIA NeMo Guardrails</strong>，支持双实现：
              <strong> NeMo Guardrails SDK</strong>（配合 Colang）用于智能校验，<strong>基于模式的匹配</strong>
              作为快速回退。所有用户输入与 AI 响应均经过校验，确保交互安全合规。
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              <AlertTitle>✅ 生产可用</AlertTitle>
              <Typography variant="body2">
                • 双实现：SDK（Colang）+ 基于模式的回退<br/>
                • 跨 5 个类别的 88 条保护模式<br/>
                • 实时输入/输出校验<br/>
                • 出错时自动回退<br/>
                • 全面监控与指标
              </Typography>
            </Alert>
          </Box>

          <Typography variant="h6" gutterBottom>
            🔒 保护类别
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    越狱检测（17 条模式）
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    防止试图覆盖系统指令、角色扮演或绕过安全协议的行为。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    安全违规（13 条模式）
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    拦截不安全的操作指导、未经培训的设备操作以及绕过安全协议的行为。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    安全违规（15 条模式）
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    防止索取安全码、访问码、限制区域以及未授权访问尝试的请求。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    合规违规（12 条模式）
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    确保遵守安全法规，防止跳过检查与规避政策。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    离题查询（13 条模式）
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    将非仓库相关查询（天气、笑话、烹饪等）重定向到仓库运营主题。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            🔧 实现
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>NeMo Guardrails SDK</Typography>
                  <Typography variant="body2" color="text.secondary">
                    智能、可编程的护栏，使用 NVIDIA 官方 SDK 与 Colang 配置。
                    通过 <code>USE_NEMO_GUARDRAILS_SDK=true</code> 环境变量启用。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>基于模式的回退</Typography>
                  <Typography variant="body2" color="text.secondary">
                    快速、轻量的关键词/短语匹配。SDK 不可用或失败时自动启用。
                    确保系统持续可靠运行。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>📖 详细文档</AlertTitle>
            <Typography variant="body2" sx={{ mt: 1 }}>
              如需包含配置、API 接口、监控与故障排查的完整文档，
              请参阅<Link href="https://github.com/NVIDIA-AI-Blueprints/Multi-Agent-Intelligent-Warehouse/blob/main/docs/architecture/guardrails-implementation.md" target="_blank" rel="noopener">护栏实现指南</Link>。
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>

      {/* Demand Forecasting System */}
      <Accordion expanded={expandedSection === 'forecasting'} onChange={handleChange('forecasting')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon color="primary" />
            需求预测系统
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              📈 AI 驱动的需求预测
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Multi-Agent-Intelligent-Warehouse 具备<strong>完整的 AI 驱动需求预测系统</strong>，
              含多模型集成、高级分析与实时预测。该系统提供准确的需求预测，以优化库存管理并减少缺货。
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              <AlertTitle>✅ 生产可用</AlertTitle>
              <Typography variant="body2">
                • 100% 动态数据库集成——无硬编码值<br/>
                • 多模型集成，含 6 种 ML 算法<br/>
                • 实时模型性能跟踪<br/>
                • NVIDIA RAPIDS cuML GPU 加速<br/>
                • 自动补货建议<br/>
                • 商业智能仪表盘
              </Typography>
            </Alert>
          </Box>

          <Typography variant="h6" gutterBottom>
            🤖 机器学习模型
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Random Forest
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>准确率：</strong>85% | <strong>MAPE：</strong>12.5% | <strong>状态：</strong>HEALTHY
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    使用多棵决策树的集成方法，预测稳健，对非线性关系处理出色。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    XGBoost (GPU-Accelerated)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>准确率：</strong>82% | <strong>MAPE：</strong>15.8% | <strong>状态：</strong>HEALTHY
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    高级梯度提升，使用 NVIDIA RAPIDS cuML 进行 GPU 加速，实现高性能预测。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Gradient Boosting
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>准确率：</strong>78% | <strong>MAPE：</strong>14.2% | <strong>状态：</strong>WARNING
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    顺序集成方法，增量构建模型以最小化预测误差。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Linear Regression
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>准确率：</strong>72% | <strong>MAPE：</strong>18.7% | <strong>状态：</strong>NEEDS_RETRAINING
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    传统线性模型，用于需求模式的基线预测与趋势分析。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Ridge Regression
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>准确率：</strong>75% | <strong>MAPE：</strong>16.3% | <strong>状态：</strong>WARNING
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    带 L2 正则化的线性回归，防止过拟合并提升泛化能力。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Support Vector Regression
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>准确率：</strong>70% | <strong>MAPE：</strong>20.1% | <strong>状态：</strong>NEEDS_RETRAINING
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    基于核的回归方法，适用于非线性模式与高维数据。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            🔧 技术架构
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>特征工程</Typography>
                  <Typography variant="body2">
                    • 滞后特征（1-30 天）<br/>
                    • 滚动统计（7、14、30 天）<br/>
                    • 季节性模式<br/>
                    • 促销影响<br/>
                    • 星期几效应
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>模型训练</Typography>
                  <Typography variant="body2">
                    • 第 1、2 阶段：基础模型<br/>
                    • 第 3 阶段：高级集成<br/>
                    • 超参数优化<br/>
                    • 时间序列交叉验证<br/>
                    • 支持 GPU 加速
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>性能跟踪</Typography>
                  <Typography variant="body2">
                    • 实时准确率监控<br/>
                    • MAPE 计算<br/>
                    • 漂移检测<br/>
                    • 预测计数<br/>
                    • 状态指示器
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            📊 API 端点
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>核心预测</Typography>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="GET" size="small" color="success" />
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              /api/v1/forecasting/dashboard
                            </Typography>
                          </Box>
                        }
                        secondary="综合预测仪表盘，含模型性能与商业智能"
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="GET" size="small" color="success" />
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              /api/v1/forecasting/real-time
                            </Typography>
                          </Box>
                        }
                        secondary="带置信区间的实时需求预测"
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="GET" size="small" color="success" />
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              /api/v1/forecasting/model-performance
                            </Typography>
                          </Box>
                        }
                        secondary="全部 6 个模型的模型健康与性能指标"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>训练与管理</Typography>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="GET" size="small" color="success" />
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              /api/v1/training/status
                            </Typography>
                          </Box>
                        }
                        secondary="当前训练状态与进度"
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="POST" size="small" color="primary" />
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              /api/v1/training/start
                            </Typography>
                          </Box>
                        }
                        secondary="启动手动训练会话"
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="GET" size="small" color="success" />
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              /api/v1/training/history
                            </Typography>
                          </Box>
                        }
                        secondary="训练会话历史与性能"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            🎯 商业智能功能
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>自动建议</Typography>
                  <Typography variant="body2">
                    • AI 建议的补货数量<br/>
                    • 紧急程度（CRITICAL、HIGH、MEDIUM、LOW）<br/>
                    • 每条建议的置信度评分<br/>
                    • 预计到货日期<br/>
                    • 成本优化建议
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>分析仪表盘</Typography>
                  <Typography variant="body2">
                    • 模型性能对比<br/>
                    • 预测准确率趋势<br/>
                    • 按 SKU 的需求模式<br/>
                    • 季节性分析<br/>
                    • 库存优化洞察
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            🚀 GPU 加速
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>NVIDIA RAPIDS cuML 集成</AlertTitle>
            <Typography variant="body2">
              预测系统支持使用 NVIDIA RAPIDS cuML 进行 GPU 加速，实现企业级性能。
              当 GPU 资源可用时，模型自动利用 CUDA 加速，以更快完成训练与推理。
            </Typography>
          </Alert>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              📁 关键文件与组件
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>后端组件</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      • src/api/routers/advanced_forecasting.py<br/>
                      • src/api/routers/training.py<br/>
                      • scripts/forecasting/phase1_phase2_forecasting_agent.py<br/>
                      • scripts/forecasting/phase3_advanced_forecasting.py<br/>
                      • scripts/forecasting/rapids_gpu_forecasting.py<br/>
                      • scripts/setup/create_model_tracking_tables.sql
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>前端组件</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      • src/ui/web/src/pages/Forecasting.tsx<br/>
                      • src/ui/web/src/services/forecastingAPI.ts<br/>
                      • src/ui/web/src/services/trainingAPI.ts<br/>
                      • 实时进度跟踪<br/>
                      • 模型性能可视化<br/>
                      • 训练管理界面
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* API Reference */}
      <Accordion expanded={expandedSection === 'api'} onChange={handleChange('api')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ApiIcon color="primary" />
            API 参考
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {apiEndpoints.map((category, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {category.category}
                    </Typography>
                    <List dense>
                      {category.endpoints.map((endpoint, epIndex) => (
                        <ListItem key={epIndex} sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={endpoint.method} 
                                  size="small" 
                                  color={endpoint.method === 'GET' ? 'success' : 'primary'}
                                />
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                  {endpoint.path}
                                </Typography>
                              </Box>
                            }
                            secondary={endpoint.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Agent Tools Overview */}
      <Accordion expanded={expandedSection === 'tools'} onChange={handleChange('tools')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BuildIcon color="primary" />
            智能体工具概览
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {toolsOverview.map((agent, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {agent.agent}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {agent.count} 个行动工具
                    </Typography>
                    <List dense>
                      {agent.tools.map((tool, toolIndex) => (
                        <ListItem key={toolIndex} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CodeIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={tool}
                            primaryTypographyProps={{ variant: 'body2', sx: { fontFamily: 'monospace' } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Implementation Journey */}
      <Accordion expanded={expandedSection === 'journey'} onChange={handleChange('journey')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            实现历程与后续步骤
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              🎯 当前状态：生产可用的基础
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              这套 Multi-Agent-Intelligent-Warehouse 是 NVIDIA AI Blueprint 架构的<strong>生产级实现</strong>。
              我们已成功构建出具备完整工具链、高级推理能力与企业级安全性的多智能体系统。
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              <AlertTitle>✅ 已完成内容</AlertTitle>
              <Typography variant="body2">
                • 多智能体编排，集成 LangGraph + MCP<br/>
                • <strong>5 个专用智能体：</strong>设备、运营、安全、预测、文档<br/>
                • 跨全部智能体的 <strong>34+ 个生产可用行动工具</strong><br/>
                • NVIDIA NIMs 集成（Nemotron 3 Super 120B + llama-nemotron-embed-vl-1b-v2 + 视觉模型）<br/>
                • <strong>文档处理：</strong>6 阶段 NVIDIA NeMo 流水线，含视觉模型<br/>
                • <strong>需求预测：</strong>6 个 ML 模型，含 NVIDIA RAPIDS GPU 加速<br/>
                • <strong>NeMo Guardrails：</strong>内容安全与合规保护<br/>
                • 高级推理引擎，支持 5 种推理类型<br/>
                • 混合 RAG 系统，PostgreSQL/TimescaleDB + Milvus<br/>
                • 实时设备遥测与监控<br/>
                • 带 AI 洞察的自动补货建议<br/>
                • <strong>聊天系统优化（2024 年 12 月）：</strong>查询缓存、请求去重、语义路由、并行工具执行、性能监控<br/>
                • 完整安全栈，JWT 认证 + RBAC（5 种用户角色）<br/>
                • 全面监控，Prometheus/Grafana<br/>
                • React 前端，Material-UI，消息分页与实时界面
              </Typography>
            </Alert>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    🚀 近期开发机会
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="完成 MCP 适配器迁移" 
                        secondary="将剩余的 WMS、IoT、RFID/条码与考勤适配器迁移到 MCP 框架"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="React Native 移动应用" 
                        secondary="为仓库工人构建具备离线能力的现场作业应用"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="增强文档处理" 
                        secondary="增加对更多文档类型的支持并提升抽取准确率"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="高级预测功能" 
                        secondary="增加季节性调整、促销影响建模与多 SKU 优化"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="实时事件流" 
                        secondary="集成 Kafka，用于实时数据处理与事件驱动架构"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="secondary">
                    🔧 高级技术增强
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="ML 驱动的预测分析" 
                        secondary="实现机器学习模型，用于需求预测与优化"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="实时事件流" 
                        secondary="集成 Kafka，用于实时数据处理与事件驱动架构"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="边缘计算部署" 
                        secondary="将轻量智能体部署到边缘设备，实现本地处理并降低延迟"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="多租户架构" 
                        secondary="支持多个仓库组织，提供数据隔离与自定义配置"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="高级安全功能" 
                        secondary="实现零信任安全、高级威胁检测与合规自动化"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              🛠️ 开发路线图
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>第 1 阶段：基础</Typography>
                    <Typography variant="body2">✅ 已完成</Typography>
                    <Typography variant="body2">核心架构、智能体与 MCP 框架</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>第 2 阶段：优化</Typography>
                    <Typography variant="body2">✅ 已完成</Typography>
                    <Typography variant="body2">聊天界面、参数校验、真实工具执行</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>第 3 阶段：规模化</Typography>
                    <Typography variant="body2">📋 规划中</Typography>
                    <Typography variant="body2">ML 分析、边缘计算、多租户</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Technical Deep Dive */}
      <Accordion expanded={expandedSection === 'technical'} onChange={handleChange('technical')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon color="primary" />
            技术深入解析
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              🏗️ 架构深入解析
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              本系统实现 NVIDIA AI Blueprint 架构，并含若干关键创新与生产可用模式。
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🤖 多智能体架构
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    系统使用 LangGraph 进行编排，含以下专用智能体：
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="规划/路由智能体" 
                        secondary="意图分类、上下文管理、响应合成、MCP 工具路由"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="设备与资产运营智能体" 
                        secondary="8 个工具，用于库存、设备、资产管理与遥测监控"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="运营协调智能体" 
                        secondary="8 个工具，用于人力、波次、排程、设备调度与 KPI"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="安全与合规智能体" 
                        secondary="7 个工具，用于事件、检查清单、告警、合规与安全管理"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="预测智能体" 
                        secondary="6 个工具，用于需求预测、补货建议、模型训练与分析"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="文档处理智能体" 
                        secondary="5 个工具，用于文档上传、OCR、结构化抽取、校验与路由"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🔧 MCP 框架创新
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    我们的 MCP 实现提供动态工具发现与执行，并含近期优化：
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="动态工具发现" 
                        secondary="可用工具的自动注册与发现"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="真实工具执行" 
                        secondary="所有 MCP 工具现均使用真实数据库数据执行"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="参数校验" 
                        secondary="带业务规则与实用警告的全面校验"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="响应格式化" 
                        secondary="整洁、专业的响应，不含技术术语"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="错误处理" 
                        secondary="优雅的错误处理，含可操作建议"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

            <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              🚀 近期系统优化（2024 年 12 月）
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              <AlertTitle>✅ 第 1、2 阶段优化已完成</AlertTitle>
              <Typography variant="body2">
                在整个聊天系统中实施了全面的性能与质量改进，
                包括数据泄漏修复、缓存、语义路由与性能监控。
              </Typography>
            </Alert>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>数据泄漏修复</Typography>
                    <Typography variant="body2">从源头消除结构化数据泄漏，响应清洗工作量减少 95%</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>查询结果缓存</Typography>
                    <Typography variant="body2">带 TTL 的内存缓存，重复查询延迟降低 50-90%</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>消息分页</Typography>
                    <Typography variant="body2">前端分页，提升长对话下的性能</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>并行工具执行</Typography>
                    <Typography variant="body2">通过并发处理，工具执行时间减少 50-80%</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>语义路由</Typography>
                    <Typography variant="body2">基于嵌入的意图分类，提升路由准确率</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>请求去重</Typography>
                    <Typography variant="body2">防止重复并发请求，降低系统负载</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>性能监控</Typography>
                    <Typography variant="body2">延迟、缓存命中、错误与路由分布的实时指标</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>响应清洗优化</Typography>
                    <Typography variant="body2">通过源头级修复，清洗复杂度降低 95%</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>参数校验</Typography>
                    <Typography variant="body2">带业务规则与实用警告的全面校验</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              🧠 高级推理引擎
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>思维链</Typography>
                    <Typography variant="body2">带中间结论的分步推理</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>多跳推理</Typography>
                    <Typography variant="body2">跨多个知识领域的复杂推理</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>场景分析</Typography>
                    <Typography variant="body2">假设分析与场景规划</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>模式识别</Typography>
                    <Typography variant="body2">从历史模式与趋势中学习</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              🗄️ 数据架构
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>PostgreSQL/TimescaleDB</Typography>
                    <Typography variant="body2">结构化数据，含面向 IoT 遥测的时序能力</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Milvus 向量数据库</Typography>
                    <Typography variant="body2">GPU 加速的语义搜索，使用 NVIDIA cuVS</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Redis 缓存</Typography>
                    <Typography variant="body2">会话管理与智能缓存，采用 LRU/LFU 策略</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Resources */}
      <Accordion expanded={expandedSection === 'resources'} onChange={handleChange('resources')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleIcon color="primary" />
            资源与文档
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📚 文档
                  </Typography>
                  <List>
                    <ListItem>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        startIcon={<BuildIcon />}
                        onClick={() => navigate('/documentation/mcp-integration')}
                        sx={{ mb: 1 }}
                      >
                        MCP 集成指南
                      </Button>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        完整的 MCP 框架文档，含实现阶段、API 参考与最佳实践
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        startIcon={<ApiIcon />}
                        onClick={() => navigate('/documentation/api-reference')}
                        sx={{ mb: 1 }}
                      >
                        API 参考
                      </Button>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        完整的 API 文档，含端点、请求示例与错误处理
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        startIcon={<RocketIcon />}
                        onClick={() => navigate('/documentation/deployment')}
                        sx={{ mb: 1 }}
                      >
                        部署指南
                      </Button>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        面向 Docker、Kubernetes 与 Helm 的生产部署说明
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        startIcon={<ArchitectureIcon />}
                        onClick={() => navigate('/documentation/architecture')}
                        sx={{ mb: 1 }}
                      >
                        架构图
                      </Button>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        系统架构与流程图，含组件说明
                      </Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🔗 外部资源
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="NVIDIA NIMs 文档" 
                        secondary="NVIDIA NIMs 官方 API 文档"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="MCP 规范" 
                        secondary="Model Context Protocol 规范"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="LangGraph 文档" 
                        secondary="多智能体编排框架"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="FastAPI 文档" 
                        secondary="现代 Python Web 框架"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Footer */}
      <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Multi-Agent-Intelligent-Warehouse — 使用 NVIDIA NIMs、MCP 框架、NeMo Guardrails 与现代 Web 技术构建
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button 
            variant="outlined" 
            startIcon={<GitHubIcon />}
            href="https://github.com/NVIDIA-AI-Blueprints/Multi-Agent-Intelligent-Warehouse"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看源码
          </Button>
          <Button variant="outlined" startIcon={<DashboardIcon />}>
            在线演示
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Documentation;
