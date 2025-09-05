import DB from "../utils/database";
import Logger from "../utils/logger";

const logger = new Logger('Settings Manager');

export type SettingDataDisplayTypes = 'number' | 'string' | 'object' | 'channel_id' | 'role_id';
export type SettingDataType = number | string | object | null;

class SettingsManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private settings: Map<string, { type: SettingDataDisplayTypes; value: any }> = new Map();

  constructor() {
    DB.all<{
      name: string;
      data_type: SettingDataDisplayTypes,
      value: string;
    }>('SELECT * FROM `settings`')
      .then((rawSettings) => {
        for (const { name, data_type, value } of rawSettings) {
          let parsedData: SettingDataType = null;

          if (data_type === 'number') {
            parsedData = parseInt(value);
          } else if (data_type === 'object') {
            parsedData = JSON.parse(value);
          } else if (data_type === 'string' || data_type === 'role_id' || data_type === 'channel_id') {
            parsedData = value;
          } else {
            logger.error('Invalid "data_type" found in settings table !');
            logger.error('Setting:', name, data_type, value);
          }

          if (parsedData) {
            this.settings.set(name, {
              type: data_type,
              value: parsedData,
            });
          }
        }

        logger.success(`Loaded ${this.settings.size}/${rawSettings.length} settings from database.`);
      })
      .catch(err => {
        logger.error('Unable to load settings from database:', err.message)
      });
  }

  get_keys(): string[] {
    return Array.from(this.settings.keys());
  }

  get<T>(key: string): T | null {
    return this.settings.get(key)?.value as T ?? null;
  }

  getDataType(key: string): SettingDataDisplayTypes | null {
    return this.settings.get(key)?.type ?? null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: string, value: any) {
    if (!this.settings.has(key)) {
      logger.error(`Tried to set an inexistant setting: ${key}`);
      return;
    }

    DB.execute(
      'UPDATE `settings` SET `value` = ? WHERE `name` = ?',
      [value, key]
    );

    const data_type = this.settings.get(key)!.type;

    this.settings.set(key, {
      type: data_type,
      value: value,
    });
  }
}

export default new SettingsManager();
