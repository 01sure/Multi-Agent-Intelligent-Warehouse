// SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/**
 * WorldRaw — Phase 17F developer inspection surface.
 *
 * Three bounded sections:
 *   MANIFEST     — DataPack structured fields + collapsible raw JSON
 *   ENTITIES     — paginated entity browser (max 50 per page, type filter)
 *   CONTEXT SNAPSHOTS — list of captured OperationalContextSnapshots
 *
 * Design constraints:
 *   - Never exposes full DataPack JSONL
 *   - Never returns all 25k entities in one payload
 *   - Selecting an entity row reuses getGraphEntity() via NodeInspector
 *   - Selecting a snapshot row navigates to the existing 17E context view
 */

import React, { useState } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  worldAPI,
  EntityBrowserItemDTO,
  ContextSnapshotListItemDTO,
  GraphNodeDTO,
} from '../../services/worldAPI';
import NodeInspector from './NodeInspector';

// ── Colour tokens (shared with other World components) ─────────────────────────

const C = {
  bg: '#0D1117',
  card: '#161B22',
  border: '#21262D',
  text: '#C9D1D9',
  muted: '#8B949E',
  dim: '#484F58',
  accent: '#58A6FF',
  green: '#3FB950',
  yellow: '#D29922',
  mono: 'monospace' as const,
};

// ── Entity type options for the selector ──────────────────────────────────────

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'Warehouse', label: '仓库' },
  { value: 'Zone', label: '库区' },
  { value: 'Location', label: '库位' },
  { value: 'Worker', label: '人力' },
  { value: 'Equipment', label: '设备' },
  { value: 'SKU', label: 'SKU' },
  { value: 'InventoryPosition', label: 'InventoryPosition' },
  { value: 'Order', label: '订单' },
  { value: 'Wave', label: '波次' },
  { value: 'Task', label: '任务' },
  { value: 'CarrierCutoff', label: 'CarrierCutoff' },
];

// ── Section heading ────────────────────────────────────────────────────────────

function SectionHeading({ label }: { label: string }) {
  return (
    <Typography
      sx={{
        fontFamily: C.mono,
        fontSize: '0.58rem',
        color: C.dim,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        mb: 1,
      }}
    >
      {label}
    </Typography>
  );
}

function ErrorPane({ message }: { message: string }) {
  return (
    <Box
      data-testid="error-pane"
      sx={{
        p: 2,
        border: `1px solid #3D1F1F`,
        borderRadius: '4px',
        background: '#1A0E0E',
      }}
    >
      <Typography sx={{ fontFamily: C.mono, fontSize: '0.68rem', color: '#F85149' }}>
        {message}
      </Typography>
    </Box>
  );
}

// ── MANIFEST section ──────────────────────────────────────────────────────────

function ManifestSection() {
  const [rawOpen, setRawOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['world-config'],
    queryFn: worldAPI.getConfig,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Box>
        <SectionHeading label="Manifest" />
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} variant="text" width="60%" height={14} sx={{ mb: 0.5, bgcolor: '#21262D' }} />
        ))}
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box>
        <SectionHeading label="清单" />
        <ErrorPane message="DataPack 清单不可用。后端可能正在启动。" />
      </Box>
    );
  }

  const gen = data.generation;
  const wh = data.warehouse;

  const fields: { key: string; value: string | number | null }[] = [
    { key: 'dataset_id', value: wh.dataset_id },
    { key: 'warehouse_id', value: wh.warehouse_id },
    { key: 'seed', value: wh.seed },
    { key: 'schema_version', value: gen.schema_version },
    { key: 'generator_version', value: gen.generator_version },
    { key: 'pack_format', value: gen.pack_format },
    { key: 'semantic_checksum', value: gen.semantic_checksum ?? '（不可用）' },
    { key: 'entity_count', value: gen.total_entities },
    { key: 'edge_count', value: gen.total_edges },
    { key: 'event_count', value: gen.total_events },
    { key: 'graph_available', value: String(gen.graph_available) },
  ];

  // Safely build raw JSON for display
  const rawJson = JSON.stringify(
    {
      dataset_id: wh.dataset_id,
      warehouse_id: wh.warehouse_id,
      seed: wh.seed,
      schema_version: gen.schema_version,
      generator_version: gen.generator_version,
      pack_format: gen.pack_format,
      semantic_checksum: gen.semantic_checksum,
      entity_count: gen.total_entities,
      edge_count: gen.total_edges,
      event_count: gen.total_events,
      graph_available: gen.graph_available,
    },
    null,
    2,
  );

  return (
    <Box data-testid="manifest-section">
      <SectionHeading label="清单 — DataPack 标识" />
      <Box
        sx={{
          border: `1px solid ${C.border}`,
          borderRadius: '4px',
          overflow: 'hidden',
          mb: 1,
        }}
      >
        {fields.map((f, i) => (
          <Box
            key={f.key}
            sx={{
              display: 'flex',
              borderBottom: i < fields.length - 1 ? `1px solid ${C.border}` : 'none',
              '&:hover': { background: '#161B22' },
            }}
          >
            <Box
              sx={{
                width: '45%',
                px: 1.5,
                py: '5px',
                borderRight: `1px solid ${C.border}`,
                flexShrink: 0,
              }}
            >
              <Typography sx={{ fontFamily: C.mono, fontSize: '0.62rem', color: C.dim }}>
                {f.key}
              </Typography>
            </Box>
            <Box sx={{ px: 1.5, py: '5px', flex: 1, overflowX: 'auto' }}>
              <Typography
                sx={{
                  fontFamily: C.mono,
                  fontSize: '0.62rem',
                  color: f.key === 'semantic_checksum' ? C.accent : C.text,
                  wordBreak: 'break-all',
                }}
              >
                {String(f.value)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Collapsible raw JSON */}
      <Box
        component="button"
        onClick={() => setRawOpen((o) => !o)}
        data-testid="manifest-raw-toggle"
        sx={{
          background: 'transparent',
          border: `1px solid ${C.border}`,
          borderRadius: '4px',
          px: 1.5,
          py: '4px',
          fontFamily: C.mono,
          fontSize: '0.6rem',
          color: C.muted,
          cursor: 'pointer',
          letterSpacing: '0.06em',
          mb: rawOpen ? 1 : 0,
          '&:hover': { color: C.text, borderColor: C.muted },
        }}
      >
        {rawOpen ? '▾ 隐藏原始 JSON' : '▸ 查看原始 JSON'}
      </Box>

      {rawOpen && (
        <Box
          data-testid="manifest-raw-json"
          sx={{
            border: `1px solid ${C.border}`,
            borderRadius: '4px',
            p: 1.5,
            background: '#0D1117',
            overflow: 'auto',
            maxHeight: 300,
          }}
        >
          <Typography
            component="pre"
            sx={{
              fontFamily: C.mono,
              fontSize: '0.6rem',
              color: C.muted,
              m: 0,
              whiteSpace: 'pre',
            }}
          >
            {rawJson}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ── ENTITIES section ──────────────────────────────────────────────────────────

function EntityRow({
  item,
  selected,
  onSelect,
}: {
  item: EntityBrowserItemDTO;
  selected: boolean;
  onSelect: (item: EntityBrowserItemDTO) => void;
}) {
  return (
    <Box
      component="button"
      onClick={() => onSelect(item)}
      data-testid={`entity-row-${item.entity_id}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        background: selected ? '#1C2128' : 'transparent',
        border: 'none',
        borderBottom: `1px solid ${C.border}`,
        px: 1.5,
        py: '6px',
        gap: 1,
        cursor: 'pointer',
        textAlign: 'left',
        '&:hover': { background: '#161B22' },
      }}
    >
      <Typography
        sx={{
          fontFamily: C.mono,
          fontSize: '0.55rem',
          color: C.dim,
          width: '90px',
          flexShrink: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {item.entity_type}
      </Typography>
      <Typography
        sx={{
          fontFamily: C.mono,
          fontSize: '0.65rem',
          color: selected ? C.accent : C.text,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.label}
      </Typography>
      <Typography
        sx={{
          fontFamily: C.mono,
          fontSize: '0.55rem',
          color: C.dim,
          flexShrink: 0,
          ml: 'auto',
        }}
      >
        {Object.entries(item.key_state)
          .filter(([, v]) => v != null)
          .map(([k, v]) => `${k}:${v}`)
          .join(' ')}
      </Typography>
    </Box>
  );
}

function EntitiesSection({
  onSelectEntity,
}: {
  onSelectEntity: (item: EntityBrowserItemDTO | null) => void;
}) {
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['world-entities', entityType, page],
    queryFn: () => worldAPI.getEntities(entityType || undefined, limit, page * limit),
    staleTime: 30_000,
    keepPreviousData: true,
  } as any);

  function handleSelect(item: EntityBrowserItemDTO) {
    const next = selectedId === item.entity_id ? null : item.entity_id;
    setSelectedId(next);
    onSelectEntity(next ? item : null);
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setEntityType(e.target.value);
    setPage(0);
    setSelectedId(null);
    onSelectEntity(null);
  }

  const items: EntityBrowserItemDTO[] = (data as any)?.items ?? [];
  const total: number = (data as any)?.total ?? 0;
  const hasMore: boolean = (data as any)?.has_more ?? false;
  const totalPages = Math.ceil(total / limit);

  return (
    <Box data-testid="entities-section">
      <SectionHeading label="实体 — 分页浏览器（每页最多 50）" />

      {/* Type selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography sx={{ fontFamily: C.mono, fontSize: '0.58rem', color: C.dim }}>
          类型：
        </Typography>
        <Box
          component="select"
          value={entityType}
          onChange={handleTypeChange}
          data-testid="entity-type-selector"
          sx={{
            background: '#161B22',
            border: `1px solid ${C.border}`,
            borderRadius: '4px',
            color: C.text,
            fontFamily: C.mono,
            fontSize: '0.62rem',
            px: 1,
            py: '3px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {ENTITY_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Box>
        {total > 0 && (
          <Typography sx={{ fontFamily: C.mono, fontSize: '0.58rem', color: C.dim, ml: 'auto' }}>
            {total.toLocaleString()} 条
          </Typography>
        )}
      </Box>

      {/* Error state */}
      {error && (
        <ErrorPane message="运营图谱不可用，无法浏览实体。" />
      )}

      {/* Loading skeleton */}
      {isLoading && !error && (
        <Box>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={28} sx={{ mb: '1px', bgcolor: '#21262D' }} />
          ))}
        </Box>
      )}

      {/* Entity list */}
      {!isLoading && !error && items.length === 0 && (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography sx={{ fontFamily: C.mono, fontSize: '0.62rem', color: C.dim }}>
            未找到实体
          </Typography>
        </Box>
      )}

      {!isLoading && !error && items.length > 0 && (
        <Box
          data-testid="entity-list"
          sx={{
            border: `1px solid ${C.border}`,
            borderRadius: '4px',
            overflow: 'hidden',
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {items.map((item: EntityBrowserItemDTO) => (
            <EntityRow
              key={item.entity_id}
              item={item}
              selected={selectedId === item.entity_id}
              onSelect={handleSelect}
            />
          ))}
        </Box>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
          data-testid="pagination-controls"
        >
          <Box
            component="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            sx={{
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: '3px',
              px: 1,
              py: '2px',
              fontFamily: C.mono,
              fontSize: '0.6rem',
              color: page === 0 ? C.dim : C.muted,
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              '&:hover:not(:disabled)': { color: C.text },
            }}
          >
            ‹ 上一页
          </Box>
          <Typography sx={{ fontFamily: C.mono, fontSize: '0.6rem', color: C.dim }}>
            {page + 1} / {totalPages}
          </Typography>
          <Box
            component="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            sx={{
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: '3px',
              px: 1,
              py: '2px',
              fontFamily: C.mono,
              fontSize: '0.6rem',
              color: !hasMore ? C.dim : C.muted,
              cursor: !hasMore ? 'not-allowed' : 'pointer',
              '&:hover:not(:disabled)': { color: C.text },
            }}
          >
            下一页 ›
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ── CONTEXT SNAPSHOTS section ─────────────────────────────────────────────────

function ContextSnapshotRow({
  snap,
  selected,
  onSelect,
}: {
  snap: ContextSnapshotListItemDTO;
  selected: boolean;
  onSelect: (turnId: string) => void;
}) {
  const ts = snap.captured_at ? new Date(snap.captured_at).toLocaleTimeString() : '';
  return (
    <Box
      component="button"
      onClick={() => onSelect(snap.turn_id)}
      data-testid={`snapshot-row-${snap.turn_id}`}
      sx={{
        display: 'flex',
        width: '100%',
        background: selected ? '#1C2128' : 'transparent',
        border: 'none',
        borderBottom: `1px solid ${C.border}`,
        px: 1.5,
        py: '6px',
        gap: 1,
        cursor: 'pointer',
        textAlign: 'left',
        '&:hover': { background: '#161B22' },
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{
            fontFamily: C.mono,
            fontSize: '0.65rem',
            color: selected ? C.accent : C.text,
          }}
        >
          {snap.focus_label}
        </Typography>
        <Typography sx={{ fontFamily: C.mono, fontSize: '0.55rem', color: C.dim, mt: '2px' }}>
          {snap.entity_count} 个实体
          {snap.truncated ? '（已截断）' : ''}
          {' · '}
          <span style={{ color: C.muted }}>trace: {snap.trace_id.slice(0, 8)}…</span>
        </Typography>
      </Box>
      <Typography
        sx={{
          fontFamily: C.mono,
          fontSize: '0.55rem',
          color: C.dim,
          flexShrink: 0,
          alignSelf: 'center',
        }}
      >
        {ts}
      </Typography>
    </Box>
  );
}

function ContextSnapshotsSection({
  onSelectSnapshot,
}: {
  onSelectSnapshot: (turnId: string | null) => void;
}) {
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['world-context-snapshots'],
    queryFn: worldAPI.getContextSnapshots,
    staleTime: 10_000,
  });

  function handleSelect(turnId: string) {
    const next = selectedTurnId === turnId ? null : turnId;
    setSelectedTurnId(next);
    onSelectSnapshot(next);
  }

  const snapshots: ContextSnapshotListItemDTO[] = (data as any)?.snapshots ?? [];

  return (
    <Box data-testid="context-snapshots-section">
      <SectionHeading label="上下文快照 — 决策时刻捕获" />

      {error && (
        <ErrorPane message="上下文快照存储不可用。" />
      )}

      {isLoading && !error && (
        <Box>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={36} sx={{ mb: '1px', bgcolor: '#21262D' }} />
          ))}
        </Box>
      )}

      {!isLoading && !error && snapshots.length === 0 && (
        <Box sx={{ py: 2 }}>
          <Typography sx={{ fontFamily: C.mono, fontSize: '0.62rem', color: C.dim }}>
            尚未捕获上下文快照。在 Copilot 中提问即可捕获。
          </Typography>
        </Box>
      )}

      {!isLoading && !error && snapshots.length > 0 && (
        <Box
          data-testid="snapshot-list"
          sx={{
            border: `1px solid ${C.border}`,
            borderRadius: '4px',
            overflow: 'hidden',
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {snapshots.map((snap) => (
            <ContextSnapshotRow
              key={snap.context_snapshot_id}
              snap={snap}
              selected={selectedTurnId === snap.turn_id}
              onSelect={handleSelect}
            />
          ))}
        </Box>
      )}

      {selectedTurnId && (
        <Box sx={{ mt: 1 }}>
          <Typography sx={{ fontFamily: C.mono, fontSize: '0.55rem', color: C.dim }}>
            打开 CONTEXT 标签页查看该轮次的完整快照。
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ── WorldRaw (root) ───────────────────────────────────────────────────────────

/** Convert a browser item to a minimal GraphNodeDTO for NodeInspector. */
function toGraphNodeDTO(item: EntityBrowserItemDTO): GraphNodeDTO {
  return {
    entity_id: item.entity_id,
    entity_type: item.entity_type,
    label: item.label,
    attributes_summary: item.key_state,
    scenario_affected: false,
    scenario_severity: null,
    bfs_depth: 0,
  };
}

interface WorldRawProps {
  onSelectSnapshot?: (turnId: string | null) => void;
}

export default function WorldRaw({ onSelectSnapshot }: WorldRawProps = {}) {
  const [inspectedNode, setInspectedNode] = useState<GraphNodeDTO | null>(null);

  function handleSelectEntity(item: EntityBrowserItemDTO | null) {
    setInspectedNode(item ? toGraphNodeDTO(item) : null);
  }

  function handleSelectSnapshot(turnId: string | null) {
    onSelectSnapshot?.(turnId);
  }

  return (
    <Box
      data-testid="world-raw"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: 2,
        background: C.bg,
        minHeight: '100%',
      }}
    >
      {/* ── MANIFEST ── */}
      <ManifestSection />

      <Box sx={{ height: '1px', background: C.border }} />

      {/* ── ENTITIES ── */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <EntitiesSection onSelectEntity={handleSelectEntity} />
        </Box>

        {/* NodeInspector opens on entity row selection — reuses existing component */}
        {inspectedNode && (
          <Box
            sx={{
              width: 340,
              flexShrink: 0,
              border: `1px solid ${C.border}`,
              borderRadius: '4px',
              overflow: 'hidden',
              alignSelf: 'flex-start',
            }}
          >
            <NodeInspector
              selectedNode={inspectedNode}
              onClose={() => setInspectedNode(null)}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ height: '1px', background: C.border }} />

      {/* ── CONTEXT SNAPSHOTS ── */}
      <ContextSnapshotsSection onSelectSnapshot={handleSelectSnapshot} />
    </Box>
  );
}
