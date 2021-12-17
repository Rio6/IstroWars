import { projectRoot } from '../utils';

export default {
   development: {
      client: 'sqlite3',
      connection: {
         filename: projectRoot() + '/db/dev.sqlite3',
      },
      useNullAsDefault: true,
   },
   production: {
      client: 'postgresql',
      connection: process.env.DATABASE_URL || {
         database: 'istrowars',
         host: 'localhost',
         user: 'istrowars',
         password: process.env.DATABASE_SECRET,
      },
   }
};
