import { add, sub, mul, div } from '@node-typescript-monorepo-template/math';
import { logger } from '@node-typescript-monorepo-template/logger';

logger.info(`add(1, 2) = ${add(1, 2)}`);
logger.info(`sub(1, 2) = ${sub(1, 2)}`);
logger.info(`mul(1, 2) = ${mul(1, 2)}`);
logger.info(`div(1, 2) = ${div(1, 2)}`);
