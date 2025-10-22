# TebexSync-Discord-Bot

TebexSync-Discord-Bot seamlessly integrates with your Tebex store to automatically grant buyers channel access and features a flexible ticket system with dynamic fields for efficient and organized support.

> [!IMPORTANT]
> This project is **not affiliated** in any way with Tebex Limited.
> It is a third party application provided and maintained by Maximus7474 to help organizations selling on tebex to grant customer roles on their discord server and provide systems to simplify purchase verification and providing support.

## Features

### Ticket System Features:
* Customizable Ticket Categories: Create multiple ticket categories, each with different prerequisites.
* Transaction ID Verification: Tickets can be configured to require a valid transaction ID from your Tebex store.
* Dynamic Forms: A modal form displays fields linked to the ticket category, with options for required inputs and minimum/maximum length.
* Support Workflow: Users can add others to a ticket, and the system includes a closure feature with an optional reason.

### Customer Role Management
* Automatic Role Assignment: Customers who make a purchase with a linked Discord account will automatically receive their roles.
* Manual Claiming: Users without a linked account can claim their roles by using a command with their transaction ID.
* Developer Access: Customers can grant access to a configurable number of developers.
* Purchase Status Sync: Roles are automatically removed if a purchase is refunded, chargebacked, or canceled. These roles cannot be claimed again.

---

## Table of Contents
- [TebexSync-Discord-Bot](#tebexsync-discord-bot)
  - [Features](#features)
    - [Ticket System Features:](#ticket-system-features)
    - [Customer Role Management](#customer-role-management)
  - [Table of Contents](#table-of-contents)
  - [📦 Setup](#-setup)
  - [🚀 Deploying](#-deploying)
    - [Deployment Steps:](#deployment-steps)
  - [🗄️ Database Management](#️-database-management)
    - [Changing the Database Provider](#changing-the-database-provider)
    - [Step-by-Step Guide for Schema Changes](#step-by-step-guide-for-schema-changes)
  - [⚠️ Security Warning: DO NOT MAKE THE `.env` FILE PUBLIC](#️-security-warning-do-not-make-the-env-file-public)

---

## 📦 Setup

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.template .env
   ```

2. Replace the following values in the `.env` file:
   - `DISCORD_BOT_TOKEN`: Your bot's authentication token from Discord's developer portal.
   - `MAIN_GUILD_ID`: The Discord ID of your main guild.

3. Run the setup script:
   ```bash
   # if using npm
   npm run setup
   # if using pnpm
   pnpm run setup
   ```
   This will install all packages, setup prisma and create the database.

---

## 🚀 Deploying

- The TypeScript code is built using `tsc`.
- The `scripts/build.js` file also transfers the `base.sql` files from the `database` folder to ensure smooth operation.

**Note:**
Building the project does not deploy the slash commands to Discord's API. You must run the `deploy` script to do so.

### Deployment Steps:
1. Build the project:
   ```bash
   pnpm run build
   ```
2. Deploy the slash commands:
   ```bash
   pnpm run deploy
   ```

**Important:**
The deploy script reads command data from the `dist/` directory. Ensure you run the build script before deploying.

---

## 🗄️ Database Management

The bot uses **Prisma** as its ORM (Object-Relational Mapper) to interact with the database. By default, it's configured to use **SQLite**, making initial setup simple and quick since SQLite is file-based and requires no separate server.

### Changing the Database Provider

If you need to change from SQLite to a different database like PostgreSQL or MySQL, you can do so by modifying the Prisma schema.

1.  **Modify the `schema.prisma` file:** Open the `prisma/schema.prisma` file. Locate the `datasource db` block and change the `provider` field to your desired database.

    ```prisma
    // For PostgreSQL
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }

    // For MySQL
    datasource db {
      provider = "mysql"
      url      = env("DATABASE_URL")
    }
    ```

2.  **Update the `.env` file:** Change the `DATABASE_URL` in your `.env` file to match your new database's connection string.

    ```env
    # For PostgreSQL
    DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

    # For MySQL
    DATABASE_URL="mysql://user:password@host:port/database"
    ```

-----

### Step-by-Step Guide for Schema Changes

When you make changes to your database schema in the `prisma/schema.prisma` file, you need to follow these steps to apply those changes to your database.

1.  **Generate the Prisma Client:** After editing your schema, run the `prisma generate` command. This command updates the generated Prisma Client with the new types and methods, ensuring your code remains type-safe.

    ```bash
    pnpm prisma generate
    ```

2.  **Run a Migration:** To apply the schema changes to your actual database, you'll use Prisma Migrate. The `migrate dev` command creates a new migration file and applies it.

    ```bash
    pnpm prisma migrate dev --name <migration_name>
    ```

    Replace `<migration_name>` with a descriptive name for your changes (e.g., `add-user-model`). This process ensures your database schema stays in sync with your Prisma schema.

For more detailed information on Prisma, including advanced migration strategies and different data modeling techniques, you can refer to the official documentation. 📖

**Prisma Documentation:** [https://www.prisma.io/docs/](https://www.google.com/search?q=https://www.prisma.io/docs/)

---

## ⚠️ Security Warning: DO NOT MAKE THE `.env` FILE PUBLIC

By default, the `.env` file is ignored by Git (via `.gitignore`).
If you disable this, it can lead to severe security risks, such as:

- Hackers gaining access to your authentication token and using it maliciously.
- Other unintended consequences.

**To stay safe:**
- Do not remove `.env` from the `.gitignore` file.
- Ensure your `.env` file remains private.

---
