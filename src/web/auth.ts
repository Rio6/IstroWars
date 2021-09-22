import { Context, Next } from 'koa';

export interface User {
   name: string;
};

export default async function(ctx: Context, next: Next) {
   ctx.user = <User> {
      name: 'R26',
   };
   return await next();
}

declare module 'koa' {
   interface BaseContext {
      user: User;
   }
};
