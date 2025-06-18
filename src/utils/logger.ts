import { gray, green, red, yellow, cyan } from './console_colours';

/**
 * Logger utility class to output formatted console logs with contextual origin and log levels.
 */
class Logger {
  private origin: string;

  /**
   * Create a new Logger instance.
   * @param origin - Identifier to indicate the source of the logs (e.g., module name).
   */
  constructor(origin: string) {
    this.origin = origin;
  }

  private timestamp(): string {
    return gray(new Date().toLocaleString());
  }

  /**
   * Log an informational message to the console.
   * @param args - The arg(s) to log.
   */
  info(...args: unknown[]): void {
    console.log(`${this.timestamp()} ${cyan(`[INFO]   `)} (${(this.origin)})`, ...args);
  }

  /**
   * Log a success message to the console.
   * @param args - The arg(s) to log.
   */
  success(...args: unknown[]): void {
    console.log(`${this.timestamp()} ${green(`[SUCCESS]`)} (${(this.origin)})`, ...args);
  }

  /**
   * Log a warning message to the console.
   * @param args - The arg(s) to log.
   */
  warn(...args: unknown[]): void {
    console.warn(`${this.timestamp()} ${yellow(`[WARN]   `)} (${(this.origin)})`, ...args);
  }

  /**
   * Log an error message to the console.
   * @param args - The arg(s) to log.
   */
  error(...args: unknown[]): void {
    console.error(`${this.timestamp()} ${red(`[ERROR]  `)} (${(this.origin)})`, ...args);
  }
}

export default Logger;
