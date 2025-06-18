// Standard colors
export function gray(text: string): string {
  return `\x1b[90m${text}\x1b[0m`;
}

export function black(text: string): string {
  return `\x1b[30m${text}\x1b[0m`;
}

export function red(text: string): string {
  return `\x1b[31m${text}\x1b[0m`;
}

export function green(text: string): string {
  return `\x1b[32m${text}\x1b[0m`;
}

export function yellow(text: string): string {
  return `\x1b[33m${text}\x1b[0m`;
}

export function blue(text: string): string {
  return `\x1b[34m${text}\x1b[0m`;
}

export function magenta(text: string): string {
  return `\x1b[35m${text}\x1b[0m`;
}

export function cyan(text: string): string {
  return `\x1b[36m${text}\x1b[0m`;
}

export function white(text: string): string {
  return `\x1b[37m${text}\x1b[0m`;
}

// Bright colors
export function brightRed(text: string): string {
  return `\x1b[91m${text}\x1b[0m`;
}

export function brightGreen(text: string): string {
  return `\x1b[92m${text}\x1b[0m`;
}

export function brightYellow(text: string): string {
  return `\x1b[93m${text}\x1b[0m`;
}

export function brightBlue(text: string): string {
  return `\x1b[94m${text}\x1b[0m`;
}

export function brightMagenta(text: string): string {
  return `\x1b[95m${text}\x1b[0m`;
}

export function brightCyan(text: string): string {
  return `\x1b[96m${text}\x1b[0m`;
}

export function brightWhite(text: string): string {
  return `\x1b[97m${text}\x1b[0m`;
}
