import pino from 'pino';
import { config } from './index';

export const logger = pino({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: config.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  base: {
    service: 'chuo-workers',
    env: config.NODE_ENV,
  },
});

export const createJobLogger = (jobName: string, jobId: string) => {
  return logger.child({ job: jobName, jobId });
};
