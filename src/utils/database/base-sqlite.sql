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

/*
    TICKETS
 */

CREATE TABLE IF NOT EXISTS `ticket_categories` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL UNIQUE,
    `description` TEXT DEFAULT NULL,
    `emoji` TEXT DEFAULT NULL, -- used for static message in dropdown menu
    `category_id` TEXT NOT NULL UNIQUE, -- discord category channel id
    `require_tbxid` INTEGER DEFAULT 1
);

-- Fields available in the modal for users to fill in
-- Excluding the transactionid if specified in the parent table
CREATE TABLE IF NOT EXISTS `ticket_category_fields` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `category` INTEGER NOT NULL,
    `label` TEXT NOT NULL,
    `placeholder` TEXT NOT NULL,
    `required` INTEGER DEFAULT 1,
    `short_field` INTEGER DEFAULT 1, -- https://discord.js.org/docs/packages/discord-api-types/main/v10/TextInputStyle:Enum
    `min_length` INTEGER DEFAULT NULL,
    `max_length` INTEGER DEFAULT NULL,

    FOREIGN KEY (`category`) REFERENCES ticket_categories(`id`)
);

CREATE TABLE IF NOT EXISTS `tickets` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `category` INTEGER NOT NULL,
    `ticket_name` TEXT NOT NULL,
    `channel_id` TEXT NOT NULL,

    `user_id` TEXT NOT NULL,
    `user_username` TEXT NOT NULL,
    `user_display_name` TEXT NOT NULL,

    `opened_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `closed_at` DATETIME DEFAULT NULL,

    FOREIGN KEY (`category`) REFERENCES ticket_categories(`id`)
);

CREATE TABLE IF NOT EXISTS `ticket_members` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `ticket` INTEGER NOT NULL,
    `user_id` TEXT NOT NULL,
    `removed` INTEGER DEFAULT 0,
    `added_by` TEXT DEFAULT NULL,
    `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(ticket, user_id),
    FOREIGN KEY (`ticket`) REFERENCES tickets(`id`)
);

CREATE TABLE IF NOT EXISTS `ticket_messages` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `ticket` INTEGER NOT NULL,
    `author_id` TEXT NOT NULL,
    `display_name` TEXT NOT NULL,
    `avatar` TEXT NOT NULL,
    `content` TEXT DEFAULT NULL,
    `edited_at` DATETIME DEFAULT NULL,
    `sent_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (`ticket`) REFERENCES tickets(`id`)
);
