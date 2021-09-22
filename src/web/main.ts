import Koa from 'koa'
import Router from '@koa/router';
import logger from 'koa-log';
import body from 'koa-body';

import starsRouter from './stars';
import auth from './auth';

async function main() {
   const app = new Koa()
   const router = new Router();

   router.use('/stars', starsRouter.routes());

   app.use(logger('short'));
   app.use(body());
   app.use(auth);
   app.use(router.routes());

   app.listen(process.env.port || 8000)
}

main().catch(console.error);
