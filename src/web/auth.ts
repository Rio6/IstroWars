import { Context, Next } from 'koa';
import Istrolid from 'istrolid';

export interface Player {
   name: string;
};

export function auth(...allowedMethods: string[]) {
   return async (ctx: Context, next: Next) => {
      try {
         ctx.player = JSON.parse(ctx.cookies.get('player', { signed: true }) as string);
      } catch(e) {
         if(ctx.method !== 'GET') {
            return ctx.status = 403;
         }
      }

      return await next();
   }
}

export async function login(ctx: Context) {
   const { name, gameKey } = ctx.request.body;
   if(await Istrolid.checkPlayer(name, gameKey)) {
      const player = {
         name: name,
      };
      ctx.cookies.set('player', JSON.stringify(player), { signed: true });
      ctx.body = { success: true };
   } else {
      ctx.status = 403;
   }
}

declare module 'koa' {
   interface BaseContext {
      player: Player;
   }
};
