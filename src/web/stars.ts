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
            player_name: ctx.player.name,
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
               player_name: ctx.player.name,
            })
            .onConflict(['star_name', 'player_name']).merge();

         ctx.body = { success: true };
      });
   }
});

router.get('/:name/ai', async ctx => {
   ctx.body = await db('stars_ais')
      .where({ star_name: ctx.params.name })
      .select('id', 'ai_name', 'player_name', 'build_bar');
});

router.get('/:name/ai/:id', async ctx => {
   ctx.body = await db('stars_ais')
      .where({ id: ctx.params.id })
      .first('id', 'ai_name', 'player_name', 'build_bar');
});

router.put('/:star_name/ai/:ai_name', async ctx => {
   const { star_name, ai_name } = ctx.params;
   const buildBar = ctx.request.body;

   await db.transaction(async tsx => {
      await tsx('stars_ais')
         .insert({
            star_name,
            player_name: ctx.player.name,
            ai_name,
            build_bar: buildBar,
            hash: hashAI({
               name: ai_name,
               buildBar,
            }),
         })
         .onConflict(['star_name', 'player_name', 'hash']).ignore()
         .returning(['id', 'ai_name', 'player_name', 'build_bar']);

      ctx.body = { success: true };
   });
});

router.delete('/:name/ai/:id', async ctx => {
   await db.transaction(async tsx => {
      const count = await tsx('stars_ais')
         .where({
            id: ctx.params.id,
            player_name: ctx.player.name,
         })
         .delete();

      ctx.body = { success: count > 0 };
   });
});

export default router;
