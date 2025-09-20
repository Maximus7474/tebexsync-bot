import Logger from "../utils/logger";

import { prisma } from "../utils/prisma";
const logger = new Logger('Settings Manager');

export type SettingDataDisplayTypes = 'number' | 'string' | 'object' | 'channel_id' | 'role_id';
export type SettingDataType = number | string | object | null;

class SettingsManager {
  private settings = new Map<string, { type: SettingDataDisplayTypes; value: SettingDataType }>();

  async initialize() {
    try {
      const rawSettings = await prisma.settings.findMany();
      for (const { name, dataType, value } of rawSettings) {
        let parsedData: SettingDataType = null;

        if (dataType === 'number') {
          parsedData = parseInt(value, 10);
        } else if (dataType === 'object') {
          parsedData = JSON.parse(value);
        } else if (dataType === 'string' || dataType === 'role_id' || dataType === 'channel_id') {
          parsedData = value;
        } else {
          logger.error('Invalid "dataType" found in settings table!');
          logger.error('Setting:', name, dataType, value);
        }

        if (parsedData !== null) {
          this.settings.set(name, {
            type: dataType as SettingDataDisplayTypes,
            value: parsedData,
          });
        }
      }

      logger.success(`Loaded ${this.settings.size}/${rawSettings.length} settings from database.`);
    } catch (err) {
      logger.error('Unable to load settings from database:', (err as Error).message);
    }
  }

  get_keys(): string[] {
    return Array.from(this.settings.keys());
  }

  get<T>(key: string): T | null {
    const setting = this.settings.get(key);
    return (setting?.value ?? null) as T;
  }

  getDataType(key: string): SettingDataDisplayTypes | null {
    return this.settings.get(key)?.type ?? null;
  }

  async set(key: string, value: SettingDataType) {
    if (!this.settings.has(key)) {
      logger.error(`Tried to set a non-existent setting: ${key}`);
      return;
    }

    try {
      const dataType = this.settings.get(key)?.type;
      let stringifiedValue = value as string;

      if (dataType === 'object') {
        stringifiedValue = JSON.stringify(value);
      } else if (dataType === 'number') {
        stringifiedValue = String(value);
      }

      await prisma.settings.update({
        where: { name: key },
        data: { value: stringifiedValue },
      });

      this.settings.set(key, {
        type: dataType!,
        value: value,
      });
    } catch (err) {
      logger.error('Unable to update setting:', (err as Error).message);
    }
  }
}

const settingsManager = new SettingsManager();
settingsManager.initialize();

export default settingsManager;
