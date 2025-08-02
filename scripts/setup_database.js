/* eslint-disable */
import { execSync } from 'child_process';
import pkg from 'colors';
const { grey, red, green, blue } = pkg;
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const databaseHandlerPath = path.join(import.meta.url, '..', 'src', 'utils', 'database', 'handler.ts');
const databaseHandlersFolder = path.join(import.meta.url, '..', 'database_handlers');

const DB_CONNECTORS = [
    {
        name: 'SQLite (better-sqlite3)',
        packageName: 'better-sqlite3 -D @types/better-sqlite3',
        handlerFilename: "sqlite.ts",
    },
    {
        name: 'MySQL/MariaDB (mysql2)',
        packageName: 'mysql2',
        handlerFilename: "mysql2.ts",
    },
    {
        name: 'PostGres (pg)',
        packageName: 'pg -D @types/pg',
        handlerFilename: "pgsql.ts",
    },
];

function detectPackageManager() {
    const userAgent = process.env.npm_config_user_agent;

    if (userAgent) {
        if (userAgent.includes('pnpm')) {
            return 'pnpm';
        }
        if (userAgent.includes('yarn')) {
            return 'yarn';
        }
        if (userAgent.includes('npm')) {
            return 'npm';
        }
    }

    throw new Error('❌ Could not detect package manager from npm_config_user_agent.');
}

function installDBPackage(packageManager, packageName) {
    console.log(`\n--- ⚙️  Installing ${packageName} using ${packageManager} ⚙️  ---\n`);
    try {
        let command;
        if (packageManager === 'npm') {
            command = `npm install ${packageName}`;
        } else if (packageManager === 'pnpm') {
            command = `pnpm add ${packageName}`;
        } else if (packageManager === 'yarn') {
            command = `yarn add ${packageName}`;
        } else {
            throw new Error(`❌ Unsupported package manager: ${packageManager}`);
        }

        execSync(command, { stdio: 'inherit' });
        console.log(green(`✅ Successfully installed ${packageName}.`));
    } catch (error) {
        throw new Error(`❌ Error installing ${packageName}: ${error.message}`);
    }
}

function updateDatabaseHandler(DBHandlerFileName) {
    console.log(`\n--- ⚙️  Updating database handler in ${blue('./src/utils/database/handler.ts')} ⚙️  ---\n`);

    try {
        const newDBHandlerClass = path.join(databaseHandlersFolder, DBHandlerFileName);
        const databaseHandlerClass = fs.readFileSync(newDBHandlerClass, 'utf8');
        let fileContent = fs.readFileSync(databaseHandlerPath, 'utf8');

        fileContent = databaseHandlerClass

        fs.writeFileSync(databaseHandlerPath, fileContent, 'utf8');
        console.log(green(`✅ Successfully updated file with the new import.\n`));
    } catch (error) {
        throw new Error(
            `❌ Error updating ${blue('./src/utils/database/index.ts')}: ${red(error.message)}\n`+
            `Complete filepath: ${databaseHandlerPath}`
        );
    }
}

async function chooseDBConnector(question, options) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        console.log(`\n${question}`);
        for (const key in options) {
            console.log(`  ${grey(key)}. ${blue(options[key]?.name)}`);
        }

        rl.question('\nEnter your choice: ', (answer) => {
            rl.close();
            if (options[answer]) {
                resolve(answer);
            } else {
                throw new Error('❌ Invalid choice. Please run the script again and select a valid option.');
            }
        });
    });
}

async function checkForOtherDbConnector(packageManager) {
    const { dependencies } = require('../package.json');
    
    const currentPackages = Object.keys(dependencies);
    let isAnotherPackageInstalled = false;

    for (const key in DB_CONNECTORS) {
        const packageName = DB_CONNECTORS[key].packageName;

        if (currentPackages.includes(packageName)) {
            isAnotherPackageInstalled = packageName;
            break;
        }
    }

    if (!isAnotherPackageInstalled) return;

    function uninstallPackage(packageManager, pckg) {
        let command;
        if (packageManager === 'npm') {
            command = `npm uninstall ${pckg}`;
        } else if (packageManager === 'pnpm') {
            command = `pnpm remove ${pckg}`;
        } else if (packageManager === 'yarn') {
            command = `yarn remove ${pckg}`;
        } else {
            throw new Error(`❌ Unsupported package manager: ${packageManager}`);
        }

        execSync(command, { stdio: 'inherit' });
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(
            `\nℹ️  You've currently got ${blue(isAnotherPackageInstalled)} installed in your dependencies.\nDo you want to uninstall it ? (Y/N) `,
            (answer) => {
                rl.close();
                if (answer.toLowerCase() === 'y') {
                    console.log(`⚙️  Uninstalling ${blue(isAnotherPackageInstalled)}...`);
                    uninstallPackage(packageManager, isAnotherPackageInstalled);
                } else {
                    console.log('ℹ️  Not uninstalling previous package');
                }
                resolve();
            }
        );
    });
}

async function main() {
    console.log('--- ⚙️  Starting database setup script ⚙️ ---');

    const packageManager = detectPackageManager();
    console.log(`✅ Detected package manager: ${green(packageManager)}`);

    await checkForOtherDbConnector(packageManager);

    const choice = await chooseDBConnector('ℹ️  Which database connector would you like to install?', DB_CONNECTORS);
    const selectedConnector = DB_CONNECTORS[choice];

    if (!selectedConnector) {
        throw new Error('❌ No valid database connector selected. Exiting.');
    }

    installDBPackage(packageManager, selectedConnector.packageName);

    updateDatabaseHandler(
        selectedConnector.handlerFilename,
    );

    console.log(`\n--- ✅ ${green('Setup Complete!')} ✅ ---`);
    console.log(`ℹ️  The database connector '${blue(selectedConnector.packageName)}' has been installed.`);
    console.log(`ℹ️  ${blue('./src/utils/database/index.ts')} has been updated.\n`);
}

main()
.catch(err => console.error(red(err.message), '\n'));