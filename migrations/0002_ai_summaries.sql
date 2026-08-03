-- AIによる週次・月次まとめ
CREATE TABLE IF NOT EXISTS ai_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  range_type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(range_type, start_date)
);
