import lodash from 'lodash';
import Router from '@koa/router'

import db from 'db';
import { hashAI } from 'utils';

const router = new Router()

router.get('/', async ctx => {
   ctx.body = await db('stars')
      .select('name', 'faction');
});

router.get('/:name', async ctx => {
   const star = await db('stars')
      .where({ name: ctx.params.name })
      .first('name', 'faction');

   if(star == null) return ctx.status = 404;

   const players = await db('stars_players')
      .where({ star_name: star.name })
      .select('player_name as name', 'side');

   const ais = await db('stars_ais')
      .where({ star_name: star.name })
      .select('ai_name as name', 'player_name as player');

   ctx.body = {
      ...star,
      players,
      ais,
   };
});

router.post('/:name/leave', async ctx => {
   await db.transaction(async tsx => {
      await tsx('stars_players')
      .where({
         star_name: ctx.params.name,
         player_name: ctx.user.name,
      })
      .delete();

      ctx.body = { success: true };
   });
});

router.post('/:name/:action', async ctx => {
   const { name: star_name, action } = ctx.params;

   if(action == 'attack' || action == 'defend') {
      await db.transaction(async tsx => {
         await tsx('stars_players')
         .insert({
            star_name,
            side: action,
            player_name: ctx.user.name,
         })
         .onConflict(['star_name', 'player_name']).merge();

         ctx.body = { success: true };
      });
   }
});

router.post('/:name/ai/add', async ctx => {
   const { name: ai_name, buildBar: build_bar } = ctx.request.body;

   if(typeof ai_name !== 'string') {
      return ctx.status = 400;
   }

   await db.transaction(async tsx => {
      await tsx('stars_ais')
      .insert({
         star_name: ctx.params.name,
         player_name: ctx.user.name,
         ai_name,
         build_bar,
         hash: hashAI(ctx.request.body),
      })
      .onConflict(['star_name', 'player_name', 'hash']).ignore();

      ctx.body = { success: true };
   });
});

router.post('/:name/ai/remove', async ctx => {
   const { name: ai_name } = ctx.request.body;

   if(typeof ai_name !== 'string') {
      return ctx.status = 400;
   }

   await db.transaction(async tsx => {
      await tsx('stars_ais')
      .where({
         star_name: ctx.params.name,
         player_name: ctx.user.name,
         ai_name,
      })
      .delete();

      ctx.body = { success: true };
   });
});

export default router;
