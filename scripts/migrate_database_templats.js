/* eslint-disable */
const fs = require('fs');
const path = require('path');

module.exports = migrateSQLFiles = () => {
  const sourceRoot = path.resolve(__dirname, '../src/utils/database');
  const destRoot = path.resolve(__dirname, '../dist/utils/database');

  const copySQLFiles = (dir) => {
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️ Directory does not exist: ${dir}`);
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        copySQLFiles(sourcePath);
      } else if (entry.isFile() && entry.name.endsWith('.sql')) {
        const relativePath = path.relative(sourceRoot, sourcePath);
        const destPath = path.join(destRoot, relativePath);

        try {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });

          fs.copyFileSync(sourcePath, destPath);
          console.log(`✅ Copied: ${relativePath}`);
        } catch (err) {
          console.error(`❌ Failed to copy ${sourcePath} → ${destPath}`, err);
        }
      }
    }
  };

  copySQLFiles(sourceRoot);
};
