-- 月間目標のデイリーチェックイン（日ごとの ⚪︎△× とひとこと）
CREATE TABLE IF NOT EXISTS goal_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(goal_id, date)
);
CREATE INDEX IF NOT EXISTS idx_goal_checkins_goal ON goal_checkins(goal_id);
