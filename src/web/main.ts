import Koa from 'koa'
import Router from '@koa/router';
import logger from 'koa-logger';

async function main() {
   const app = new Koa()
   const router = new Router();

   router.get('/', ctx => {
      ctx.body = 'hello, world';
   });

   app.use(logger());
   app.use(router.routes());

   const port = process.env.port || 8000;
   console.log("Starting web server on port", port);
   app.listen(port)
}

main().catch(console.error);
