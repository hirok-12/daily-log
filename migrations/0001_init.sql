-- Migration number: 0001 	 daily-log initial schema
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  wins TEXT NOT NULL DEFAULT '',
  gratitude TEXT NOT NULL DEFAULT '',
  health TEXT NOT NULL DEFAULT '',
  social TEXT NOT NULL DEFAULT '',
  self_talk TEXT NOT NULL DEFAULT '',
  learnings TEXT NOT NULL DEFAULT '',
  ai_review TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_date TEXT NOT NULL,
  title TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
