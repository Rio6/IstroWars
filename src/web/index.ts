import Koa from 'koa'
import Router from '@koa/router';
import cors from '@koa/cors';
import send from 'koa-send';
import logger from 'koa-log';
import body from 'koa-body';

import { isDev } from 'utils';
import starsRouter from './stars';
import { auth } from './auth';

async function main() {
   const app = new Koa()
   const router = new Router();

   if(process.env.SECRET)
      app.keys = [process.env.SECRET];
   else if(isDev())
      app.keys = ['DEBUG'];
   else
      throw new Error("No secret provided");

   router.use(auth);
   router.use('/api/stars', starsRouter.routes());

   router.get('/js/:path(.*)', async ctx => {
      const result = await send(ctx, ctx.params.path, { root: __dirname + '/..' });
   });

   app.use(logger(isDev() ? 'dev' : 'short'));
   app.use(cors({ credentials: true }));
   app.use(body());
   app.use(router.routes());

   const port = process.env.PORT || 8000;
   app.listen(port);
   console.log("Server started on", port);
}

main().catch(console.error);
