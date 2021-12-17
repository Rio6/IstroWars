import knex from 'knex';
import { isDev } from 'utils';
import config from './config';
export * from './types';
export default isDev() ? knex(config.development) : knex(config.production);
