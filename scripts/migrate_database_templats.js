/* eslint-disable */

import pkg from 'colors';
const { red, green } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default () => {
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
                    console.log(`  - ${green('Copied')}: ${relativePath}`);
                } catch (err) {
                    console.error(`  - ${red('Failed to copy')} ${entry.name}\n   `, err);
                }
            }
        }
    };

    copySQLFiles(sourceRoot);
};
