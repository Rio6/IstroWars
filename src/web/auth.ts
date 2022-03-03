import { Context, Next } from 'koa';
import Istrolid from 'istrolid';

export interface Player {
   name: string;
};

export async function auth(ctx: Context, next: Next) {
   try {
      ctx.player = JSON.parse(ctx.cookies.get('player', { signed: true }) as string);

   } catch(e) {
      const name = ctx.get('x-istrowars-name');
      const gameKey = ctx.get('x-istrowars-key');
      if(name && gameKey && await Istrolid.checkPlayer(name, gameKey)) {
         ctx.player = {
            name: name,
         };
         ctx.cookies.set('player', JSON.stringify(ctx.player), { signed: true });
         ctx.body = { success: true };

         console.log('Logged in player', name);

      } else if(ctx.method !== 'GET') {
         return ctx.status = 403;
      }
   }

   await next();
}

declare module 'koa' {
   interface BaseContext {
      player: Player;
   }
};
