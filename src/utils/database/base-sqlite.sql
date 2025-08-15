CREATE TABLE IF NOT EXISTS `settings` (
    `name` TEXT PRIMARY KEY,
    `data_type` TEXT NOT NULL,
    `value` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `transactions` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `tbxid` TEXT UNIQUE NOT NULL,
    `email` TEXT NOT NULL,
    `chargeback` INTEGER DEFAULT 0,
    `refund` INTEGER DEFAULT 0,
    `discord_id` TEXT NOT NULL,
    `purchaser_name` TEXT NOT NULL,
    `purchaser_uuid` TEXT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `transaction_packages` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `tbxid` TEXT NOT NULL,
    `package` TEXT NOT NULL,

    FOREIGN KEY (`tbxid`) REFERENCES transactions(`tbxid`)
);

CREATE TABLE IF NOT EXISTS `customer_developers` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `tbxid` TEXT NOT NULL,
    `discord_id` TEXT NOT NULL,
    `added_by` TEXT NOT NULL,
    `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tbxid, discord_id),
    FOREIGN KEY (`tbxid`) REFERENCES transactions(`tbxid`)
);

/* Default settings */
INSERT OR IGNORE INTO `settings` (`name`, `data_type`, `value`) VALUES
    ('customer_role', 'string', 'role_id'),
    ('customers_dev_role', 'string', 'role_id'),
    ('payment_log_channel', 'string', 'channel_id'),
    ('notifying_discord_id', 'string', 'user_id'),
    ('max_developers', 'number', 2);
