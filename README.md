# Discord TS Boilerplate

*Inspired by [discord-js-template](https://github.com/Maximus7474/discord-js-template) originaly created by [Furious Feline](https://github.com/FissionFeline)*


---

## 📦 Setup

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.template .env
   ```

2. Replace the following values in the `.env` file:
   - `DISCORD_BOT_TOKEN`: Your bot's authentication token from Discord's developer portal.
   - `MAIN_GUILD_ID`: The Discord ID of your main guild.

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

- The bot currently supports multiple database systems but is configured to run with `sqlite` by default.
- Contributions for integrating other database systems (e.g., MySQL, MariaDB, PostgreSQL, MongoDB) are welcome.  
  However, the project aims to avoid adding unused dependencies.

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
