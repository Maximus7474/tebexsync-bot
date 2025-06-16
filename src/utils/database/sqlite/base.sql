-- Placeholder table as example
CREATE TABLE IF NOT EXISTS users (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL,
    `email` TEXT UNIQUE NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);