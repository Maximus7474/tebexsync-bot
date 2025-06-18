/* eslint-disable */
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const migrateSQLFiles = require("./migrate_database_templats.js");

const distPath = path.join(__dirname, "../dist");

if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
  console.log("✅ Cleaned old build files.");
} else {
  console.log("ℹ️  No previous build found, skipping clean.");
}

exec("tsc", (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Build failed:\n${stderr}`);
    process.exit(1);
  } else {
    console.log("✅ Build complete.");
    if (stdout) console.log(stdout);

    migrateSQLFiles();
    console.log("✅ SQL files migrated to dist folder.");
  }
});
