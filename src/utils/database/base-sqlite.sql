CREATE TABLE IF NOT EXISTS `settings` (
    `name` TEXT PRIMARY KEY,
    `data_type` TEXT NOT NULL,
    `value` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS `transactions` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `tbxid` TEXT UNIQUE NOT NULL,
    `email` TEXT,
    `chargeback` INTEGER DEFAULT 0,
    `refund` INTEGER DEFAULT 0,
    `discord_id` TEXT,
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
    ('customer_role', 'string', '1354857644174872737'),
    ('customers_dev_role', 'string', '1354857695316017334'),
    ('payment_log_channel', 'string', '1209137239217537126'),
    ('notifying_discord_id', 'string', '336592756698906626'),
    ('max_developers', 'number', 2);
