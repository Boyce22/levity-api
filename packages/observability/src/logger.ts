import pino, { type Logger } from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface CreateLoggerOptions {
  level?: LogLevel;
  pretty?: boolean;
  bindings?: Record<string, unknown>;
}

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const { level = 'info', pretty = false, bindings } = options;

  return pino({
    level,
    ...(bindings ? { base: { ...bindings } } : {}),
    ...(pretty && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname,req,res,responseTime',
          levelFirst: false,
          customColors:
            'fatal:bgRed,error:red,warn:yellow,info:cyan,debug:white,trace:gray',
          singleLine: false,
        },
      },
    }),
  });
}

export type { Logger };
