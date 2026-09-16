# SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
"""
Safety router — Batch D.

Incident CRUD uses SQLRetriever directly.  The canonical SafetyComplianceAgent
is a reasoning agent wired into the chat router — it is not used for CRUD.

Policies are static reference data (no DB table) — preserved as-is from src/.
"""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Safety"])

_sql = None


def _get_sql():
    global _sql
    if _sql is None:
        from src.retrieval.structured import SQLRetriever

        _sql = SQLRetriever()
    return _sql


class SafetyIncident(BaseModel):
    id: int
    severity: str
    description: str
    reported_by: str
    occurred_at: str


class SafetyIncidentCreate(BaseModel):
    severity: str
    description: str
    reported_by: str


class SafetyPolicy(BaseModel):
    id: str
    name: str
    category: str
    last_updated: str
    status: str
    summary: str


_POLICIES: List[SafetyPolicy] = [
    SafetyPolicy(
        id="POL-001",
        name="个人防护装备（PPE）政策",
        category="安全设备",
        last_updated="2024-01-15",
        status="Active",
        summary="所有人员在指定区域必须佩戴适当的个人防护装备",
    ),
    SafetyPolicy(
        id="POL-002",
        name="叉车操作安全指南",
        category="设备安全",
        last_updated="2024-01-10",
        status="Active",
        summary="叉车安全操作综合指南",
    ),
    SafetyPolicy(
        id="POL-003",
        name="紧急疏散程序",
        category="应急响应",
        last_updated="2024-01-05",
        status="Active",
        summary="分步紧急疏散程序",
    ),
    SafetyPolicy(
        id="POL-004",
        name="化学品操作安全规程",
        category="化学品安全",
        last_updated="2024-01-12",
        status="Active",
        summary="化学品安全操作与储存程序",
    ),
    SafetyPolicy(
        id="POL-005",
        name="梯子与高处作业安全",
        category="坠落防护",
        last_updated="2024-01-08",
        status="Active",
        summary="高处作业安全要求",
    ),
]


@router.get("/safety/incidents", response_model=List[SafetyIncident])
async def get_incidents():
    """List all safety incidents ordered by occurrence time."""
    try:
        sql = _get_sql()
        await sql.initialize()
        rows = await sql.fetch_all(
            "SELECT id, severity, description, reported_by, occurred_at "
            "FROM safety_incidents ORDER BY occurred_at DESC"
        )
        return [
            SafetyIncident(
                id=r["id"],
                severity=r["severity"],
                description=r["description"],
                reported_by=r["reported_by"],
                occurred_at=r["occurred_at"].isoformat() if r["occurred_at"] else "",
            )
            for r in rows
        ]
    except Exception as exc:
        logger.error("Failed to get safety incidents: %s", exc)
        raise HTTPException(
            status_code=500, detail="获取安全事件列表失败"
        )


@router.get("/safety/incidents/{incident_id}", response_model=SafetyIncident)
async def get_incident(incident_id: int):
    """Get a specific safety incident by ID."""
    try:
        sql = _get_sql()
        await sql.initialize()
        row = await sql.fetch_one(
            "SELECT id, severity, description, reported_by, occurred_at "
            "FROM safety_incidents WHERE id = $1",
            incident_id,
        )
        if not row:
            raise HTTPException(
                status_code=404,
                detail=f"安全事件 {incident_id} 未找到",
            )
        return SafetyIncident(
            id=row["id"],
            severity=row["severity"],
            description=row["description"],
            reported_by=row["reported_by"],
            occurred_at=row["occurred_at"].isoformat() if row["occurred_at"] else "",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to get safety incident %s: %s", incident_id, exc)
        raise HTTPException(
            status_code=500, detail="获取安全事件失败"
        )


@router.post("/safety/incidents", response_model=SafetyIncident)
async def create_incident(incident: SafetyIncidentCreate):
    """Create a new safety incident record."""
    try:
        sql = _get_sql()
        await sql.initialize()
        result = await sql.fetch_one(
            """
            INSERT INTO safety_incidents (severity, description, reported_by, occurred_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, severity, description, reported_by, occurred_at
            """,
            incident.severity,
            incident.description,
            incident.reported_by,
        )
        return SafetyIncident(
            id=result["id"],
            severity=result["severity"],
            description=result["description"],
            reported_by=result["reported_by"],
            occurred_at=(
                result["occurred_at"].isoformat() if result["occurred_at"] else ""
            ),
        )
    except Exception as exc:
        logger.error("Failed to create safety incident: %s", exc)
        raise HTTPException(status_code=500, detail="创建安全事件失败")


@router.get("/safety/policies", response_model=List[SafetyPolicy])
async def get_policies():
    """List all safety policies (static reference data)."""
    return _POLICIES


@router.get("/safety/policies/{policy_id}", response_model=SafetyPolicy)
async def get_policy(policy_id: str):
    """Get a specific safety policy by ID."""
    for policy in _POLICIES:
        if policy.id == policy_id:
            return policy
    raise HTTPException(status_code=404, detail=f"安全政策 {policy_id} 未找到")
