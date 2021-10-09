import Koa from 'koa'
import Router from '@koa/router';
import logger from 'koa-log';
import body from 'koa-body';

import { isDev } from 'utils';
import starsRouter from './stars';
import { auth, login } from './auth';

async function main() {
   const app = new Koa()
   const router = new Router();

   if(process.env.SECRET)
      app.keys = [process.env.SECRET];
   else if(isDev())
      app.keys = ['DEBUG'];
   else
      throw new Error("No secret provided");

   router.post('/login', login);

   router.use(auth('GET'));
   router.use('/stars', starsRouter.routes());

   app.use(logger(isDev() ? 'dev' : 'short'));
   app.use(body());
   app.use(router.routes());

   const port = process.env.port || 8000;
   app.listen(port);
   console.log("Server started on", port);
}

main().catch(console.error);
