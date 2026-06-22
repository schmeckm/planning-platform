-- Open Planning Platform – PostgreSQL schema
-- Shadow-Planning tables: results are ONLY written here, never to ERP systems.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Simulation Runs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS simulation_runs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT NOT NULL,
    description   TEXT,
    triggered_by  TEXT NOT NULL,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at   TIMESTAMPTZ,
    status        TEXT NOT NULL CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
    order_ids     JSONB NOT NULL DEFAULT '[]',
    results       JSONB NOT NULL DEFAULT '[]',
    audit_trail   JSONB NOT NULL DEFAULT '[]',
    metadata      JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Planning Orders (canonical shadow copy) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS planning_orders (
    id                  TEXT PRIMARY KEY,
    external_id         TEXT,
    source_system       TEXT,
    material_id         TEXT NOT NULL,
    batch_id            TEXT,
    quantity            NUMERIC NOT NULL,
    unit                TEXT NOT NULL,
    priority            TEXT NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'NORMAL', 'LOW')),
    status              TEXT NOT NULL,
    scheduling_status   TEXT NOT NULL,
    earliest_start      TIMESTAMPTZ NOT NULL,
    latest_finish       TIMESTAMPTZ NOT NULL,
    duration_minutes    INTEGER NOT NULL,
    operations          JSONB NOT NULL DEFAULT '[]',
    tags                JSONB NOT NULL DEFAULT '{}',
    patient_id          TEXT,
    scheduled_start     TIMESTAMPTZ,
    scheduled_finish    TIMESTAMPTZ,
    metadata            JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_scheduling_status ON planning_orders (scheduling_status);
CREATE INDEX IF NOT EXISTS idx_orders_material_id ON planning_orders (material_id);
CREATE INDEX IF NOT EXISTS idx_orders_patient_id ON planning_orders (patient_id) WHERE patient_id IS NOT NULL;

-- ─── Audit Trail ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_trail (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sim_run_id          UUID REFERENCES simulation_runs(id),
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor               TEXT NOT NULL,
    action              TEXT NOT NULL,
    entity_type         TEXT NOT NULL,
    entity_id           TEXT NOT NULL,
    before_state        JSONB,
    after_state         JSONB,
    reason              TEXT,
    electronic_signature TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_trail (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_sim_run ON audit_trail (sim_run_id);

-- ─── Constraint Evaluation Results ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS constraint_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sim_run_id          UUID REFERENCES simulation_runs(id),
    order_id            TEXT NOT NULL,
    constraint_id       TEXT NOT NULL,
    constraint_version  TEXT NOT NULL,
    severity            TEXT NOT NULL,
    passed              BOOLEAN NOT NULL,
    score               NUMERIC(4,3),
    message             TEXT NOT NULL,
    explanation         TEXT NOT NULL,
    correction_hint     TEXT,
    detail              JSONB NOT NULL DEFAULT '{}',
    evaluated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_constraint_results_order ON constraint_results (order_id);
CREATE INDEX IF NOT EXISTS idx_constraint_results_run ON constraint_results (sim_run_id);
CREATE INDEX IF NOT EXISTS idx_constraint_results_passed ON constraint_results (passed, severity);
