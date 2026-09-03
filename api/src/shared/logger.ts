import pino, { type Logger } from 'pino';
import prettyStream from 'pino-pretty';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface CreateLoggerOptions {
  level?: LogLevel;
  pretty?: boolean;
  bindings?: Record<string, unknown>;
}

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const { level = 'info', pretty = false, bindings } = options;

  const loggerOptions = {
    level,
    ...(bindings ? { base: { ...bindings } } : {}),
  };

  if (!pretty) {
    return pino(loggerOptions);
  }

  return pino(
    loggerOptions,
    prettyStream({
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname,req,res,responseTime',
      levelFirst: false,
      customColors: 'fatal:bgRed,error:red,warn:yellow,info:cyan,debug:white,trace:gray',
      singleLine: false,
    }),
  );
}

export type { Logger };
