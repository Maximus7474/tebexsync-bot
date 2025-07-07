PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS `transactions` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `tbxid` TEXT UNIQUE NOT NULL,
    `email` TEXT UNIQUE NOT NULL,
    `chargeback` INTEGER DEFAULT 0,
    `discord_id` TEXT NOT NULL,
    `webstore` TEXT NOT NULL,
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

    FOREIGN KEY (`tbxid`) REFERENCES transactions(`tbxid`)
);

COMMIT;
