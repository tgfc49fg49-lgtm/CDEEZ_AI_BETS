create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  sport text not null,
  league text not null,
  home_team text not null,
  away_team text not null,
  venue text,
  starts_at timestamptz not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists odds_lines (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  sportsbook text not null,
  home_moneyline integer,
  away_moneyline integer,
  spread numeric,
  spread_odds integer,
  total numeric,
  over_odds integer,
  under_odds integer,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  pick text not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 100),
  edge numeric not null default 0,
  model_note text,
  model_version text not null default 'v0.1',
  created_at timestamptz not null default now()
);

create table if not exists bet_records (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete set null,
  market text not null,
  pick text not null,
  odds integer not null,
  stake numeric not null check (stake >= 0),
  status text not null default 'open',
  result numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bankroll_events (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  amount numeric not null,
  balance numeric not null,
  event_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists games_starts_at_idx on games(starts_at);
create index if not exists odds_lines_game_id_idx on odds_lines(game_id);
create index if not exists predictions_game_id_idx on predictions(game_id);
create index if not exists bet_records_game_id_idx on bet_records(game_id);

create table if not exists daily_ai_picks (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete set null,
  pick text not null,
  market text not null,
  sportsbook text not null,
  odds integer not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 100),
  edge numeric not null default 0,
  evidence text,
  submitted_at timestamptz not null,
  result_due_at timestamptz not null,
  status text not null default 'pending',
  result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dfs_uploads (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  target_budget numeric not null,
  generated_lineup jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists daily_ai_picks_submitted_at_idx on daily_ai_picks(submitted_at);
create index if not exists daily_ai_picks_status_idx on daily_ai_picks(status);
