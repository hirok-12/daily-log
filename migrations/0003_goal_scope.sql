-- 目標の粒度: 'day'（特定日）| 'month'（月間目標、target_date はその月の1日）
ALTER TABLE goals ADD COLUMN scope TEXT NOT NULL DEFAULT 'day';
