#### Manager dashboard updated with new gui and admin control acess
#### select.js modified to show the current job processing status in select.html





DB migrations (Postgres)

Use JSONB so it works for all protocols (MF52/MF62/FTire) without spraying columns.

-- add to your existing projects table
ALTER TABLE projects
  ADD COLUMN inputs JSONB,         -- the form: RW, RD, NW, OD, P, L1..L3, VEL, IA, SA, SR, AR, etc.
  ADD COLUMN results JSONB,        -- the computed 132-row table, derived metrics, file paths
  ADD COLUMN tydex_path TEXT;      -- optional: where the Tydex ends up

-- optional but recommended: keep per-run history (audit/repro)
CREATE TABLE project_runs (
  id BIGSERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_no INTEGER NOT NULL,
  inputs JSONB NOT NULL,
  results JSONB,
  tydex_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, run_no)
);

-- if you want to store each test row explicitly (instead of inside results JSON):
CREATE TABLE project_tests (
  id BIGSERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_no INTEGER NOT NULL,
  test_index INTEGER NOT NULL,         -- 1..132
  params JSONB NOT NULL,               -- {pressure, load, ia, sa, sr, speed, ...}
  output JSONB,                        -- any per-test metrics
  status TEXT DEFAULT 'Not started',
  ran_at TIMESTAMPTZ
);
CREATE INDEX idx_project_tests_proj_run ON project_tests(project_id, run_no);
