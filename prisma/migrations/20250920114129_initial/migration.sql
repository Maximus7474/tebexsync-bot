-- CreateTable
CREATE TABLE "settings" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "data_type" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discord_id" TEXT,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tbxid" TEXT NOT NULL,
    "customer_id" INTEGER,
    "chargeback" INTEGER NOT NULL DEFAULT 0,
    "refund" INTEGER NOT NULL DEFAULT 0,
    "purchaser_name" TEXT NOT NULL,
    "purchaser_uuid" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transaction_packages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tbxid" TEXT NOT NULL,
    "package" TEXT NOT NULL,
    CONSTRAINT "transaction_packages_tbxid_fkey" FOREIGN KEY ("tbxid") REFERENCES "transactions" ("tbxid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customer_developers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "discord_id" TEXT NOT NULL,
    "added_by" TEXT NOT NULL,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_developers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT,
    "category_id" TEXT NOT NULL,
    "require_tbxid" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "ticket_category_fields" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT NOT NULL,
    "required" INTEGER NOT NULL DEFAULT 1,
    "short_field" INTEGER NOT NULL DEFAULT 1,
    "min_length" INTEGER,
    "max_length" INTEGER,
    CONSTRAINT "ticket_category_fields_category_fkey" FOREIGN KEY ("category") REFERENCES "ticket_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" INTEGER NOT NULL,
    "ticket_name" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_username" TEXT NOT NULL,
    "user_display_name" TEXT NOT NULL,
    "opened_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" DATETIME,
    CONSTRAINT "tickets_category_fkey" FOREIGN KEY ("category") REFERENCES "ticket_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket_members" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticket" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "removed" INTEGER NOT NULL DEFAULT 0,
    "added_by" TEXT,
    "added_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_members_ticket_fkey" FOREIGN KEY ("ticket") REFERENCES "tickets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticket" INTEGER NOT NULL,
    "author_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "content" TEXT,
    "edited_at" DATETIME,
    "sent_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_messages_ticket_fkey" FOREIGN KEY ("ticket") REFERENCES "tickets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_discord_id_key" ON "customers"("discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_tbxid_key" ON "transactions"("tbxid");

-- CreateIndex
CREATE UNIQUE INDEX "customer_developers_customer_id_discord_id_key" ON "customer_developers"("customer_id", "discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_categories_name_key" ON "ticket_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_categories_category_id_key" ON "ticket_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_members_ticket_user_id_key" ON "ticket_members"("ticket", "user_id");
