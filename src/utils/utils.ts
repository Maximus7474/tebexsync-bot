import * as fs from 'fs';
import path from 'path';

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
