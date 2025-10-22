/* eslint-disable */
import { exec } from "child_process";
import fs from "fs/promises";
import * as syncFs from "node:fs";
import path from "path";
import { fileURLToPath } from 'url';
import pkg from 'colors';
const { red, green, blue } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, "../dist");

const pathExists = syncFs.existsSync(distPath);
if (pathExists) {
    syncFs.rmSync(distPath, { recursive: true, force: true });
    console.log(green("✅ Cleaned old build files.\n"));
} else {
    console.log(blue("ℹ️  No previous build found, skipping clean.\n"));
}

async function addJsExtensions(dir) {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            await addJsExtensions(fullPath);
        } else if (file.isFile() && file.name.endsWith('.js')) {
            let content = await fs.readFile(fullPath, 'utf8');
            let modified = false;

            const regex = /(from|import)\s+['"](?<relativePath>\.\.?\/[^'"]+)['"]/g;

            content = content.replace(regex, (match, type, relativePath) => {
                const absoluteTargetPath = path.resolve(dir, relativePath);

                if (syncFs.existsSync(absoluteTargetPath + '.js')) {
                    modified = true;
                    return `${type} '${relativePath}.js'`;
                } else if (syncFs.existsSync(path.join(absoluteTargetPath, 'index.js'))) {
                    modified = true;
                    return `${type} '${relativePath}/index.js'`;
                }
                return match;
            });

            const exportRegex = /export\s+{.*}\s+from\s+['"](?<relativePath>\.\.?\/[^'"]+)['"]/g;
            content = content.replace(exportRegex, (match, relativePath) => {
                const absoluteTargetPath = path.resolve(dir, relativePath);
                if (syncFs.existsSync(absoluteTargetPath + '.js')) {
                    modified = true;
                    return `export {${match.split('{')[1].split('}')[0]}} from '${relativePath}.js'`;
                }
                else if (syncFs.existsSync(path.join(absoluteTargetPath, 'index.js'))) {
                    modified = true;
                    return `export {${match.split('{')[1].split('}')[0]}} from '${relativePath}/index.js'`;
                }
                return match;
            });


            if (modified) {
                await fs.writeFile(fullPath, content, 'utf8');
                console.log(blue(`\tUpdated imports in: ${path.relative(__dirname, fullPath)}`));
            }
        }
    }
}


exec("tsc", async (error, stdout, stderr) => {
    if (error) {
        console.error(red(`❌ Build failed, ${error}`), `\n${stdout}`);
        process.exit(1);
    } else {
        console.log(green("✅ TypeScript build complete."));
        if (stdout) console.log(stdout);

        console.log(blue("ℹ️  Adding .js extensions to compiled ES Modules..."));
        try {
            await addJsExtensions(distPath);
            console.log(green("✅ .js extensions added to imports/exports."));
        } catch (extError) {
            console.error(red(`❌ Failed to add .js extensions: ${extError}`));
            process.exit(1);
        }

        console.log(green("\n✅ SQL files migrated to dist folder."));
    }
});
