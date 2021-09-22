import knex from 'knex';
import { isDev } from 'utils';

function sqliteDB() {
   return knex({
      client: 'sqlite3',
      connection: {
         filename: 'db/dev.sqlite3',
      },
   });
}

function postgresDB() {
   // TODO
   return knex({
      client: 'postgres',
   });
}

export default isDev() ? sqliteDB() : postgresDB();
