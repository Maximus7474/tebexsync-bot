import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const dirname = path.dirname(fileURLToPath(import.meta.url));

export const getFilesFromDir = (dirPath: string): string[] => {
  const files: string[] = [];

  const items = fs.readdirSync(dirPath);

  items.forEach((item) => {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      files.push(...getFilesFromDir(itemPath));
    } else if (stats.isFile() && (item.endsWith('.ts') || item.endsWith('.js'))) {
      files.push(itemPath);
    }
  });

  return files;
}

export const loadConfigFile = <T>(fileName: string): T => {
  const filePath = path.join(dirname, '..', '..', 'config', fileName);

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const parsedConfig = JSON.parse(fileContent);

  return parsedConfig;
}
