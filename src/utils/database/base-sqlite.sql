/*
    GLOBAL TABLES & DATA
 */

CREATE TABLE IF NOT EXISTS `settings` (
    `name` TEXT PRIMARY KEY,
    `data_type` TEXT NOT NULL,
    `value` TEXT NOT NULL
);

/* Default settings */
INSERT OR IGNORE INTO `settings` (`name`, `data_type`, `value`) VALUES
    ('customer_role', 'string', '1354857644174872737'),
    ('customers_dev_role', 'string', '1354857695316017334'),
    ('payment_log_channel', 'string', '1209137239217537126'),
    ('notifying_discord_id', 'string', '336592756698906626'),
    ('max_developers', 'number', 2);

/*
    CUSTOMERS & TRANSACTIONS
 */

CREATE TABLE IF NOT EXISTS `customers` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `discord_id` TEXT UNIQUE,
    `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `transactions` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `tbxid` TEXT UNIQUE NOT NULL,
    `customer_id` INTEGER,
    `chargeback` INTEGER DEFAULT 0,
    `refund` INTEGER DEFAULT 0,
    `purchaser_name` TEXT NOT NULL,
    `purchaser_uuid` TEXT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`customer_id`) REFERENCES customers(`id`)
);

CREATE TABLE IF NOT EXISTS `transaction_packages` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `tbxid` TEXT NOT NULL,
    `package` TEXT NOT NULL,

    FOREIGN KEY (`tbxid`) REFERENCES transactions(`tbxid`)
);

CREATE TABLE IF NOT EXISTS `customer_developers` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `customer_id` INTEGER NOT NULL,
    `discord_id` TEXT NOT NULL,
    `added_by` TEXT NOT NULL,
    `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(customer_id, discord_id),
    FOREIGN KEY (`customer_id`) REFERENCES customers(`id`)
);
