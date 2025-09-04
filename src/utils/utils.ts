import Logger from "./logger";
const logger = new Logger('UTILS');

export const tbxIdRegex = /tbx-[a-z0-9]{11,14}-[a-z0-9]{6}/g;

export function GetUtcTimestamp(time: string, date: string, invoker?: string): number {
  const dateRegex = /^\d{2}\/\d{2}\/\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
  const now = new Date();

  let year: number;
  let month: number;
  let day: number;
  let hours: number;
  let minutes: number;
  let seconds: number;

  if (!dateRegex.test(date)) {
    logger.warn(`[GetUtcTimestamp] Unable to parse date, invalid format: "${date}" - invoking resource: ${invoker ?? 'unknown'}`);

    year = now.getUTCFullYear();
    month = now.getUTCMonth();
    day = now.getUTCDate();
  } else {
    const dateParts = date.split('/');

    year = parseInt(dateParts[2], 10) + 2000;
    month = parseInt(dateParts[1], 10) - 1;
    day = parseInt(dateParts[0], 10);
  }

  if (!timeRegex.test(time)) {
    logger.warn(`[GetUtcTimestamp] Unable to parse time, invalid format: "${time}" - invoking resource: ${invoker ?? 'unknown'}`);

    hours = now.getUTCHours();
    minutes = now.getUTCMinutes();
    seconds = now.getUTCSeconds();
  } else {
    const timeParts = time.split(':');

    hours = parseInt(timeParts[0], 10);
    minutes = parseInt(timeParts[1], 10);
    seconds = timeParts.length === 3 ? parseInt(timeParts[2], 10) : 0;
  }

  const utcTimestamp = Date.UTC(year, month, day, hours, minutes, seconds);

  return utcTimestamp;
}

export function FormatDateForDB(date?: Date): string {
  if (!date) date = new Date();

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
