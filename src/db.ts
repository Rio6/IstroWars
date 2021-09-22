import knex from 'knex';

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

export default process.env.NODE_ENV === 'production'
   ? postgresDB()
   : sqliteDB();
