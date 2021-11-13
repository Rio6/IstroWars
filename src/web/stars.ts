import Router from '@koa/router'

import db, { Star } from 'db';
import { hashAI } from 'utils';

const router = new Router()

async function extraStarInfo(star: Pick<Star, 'id' | 'star_name'>) {
   // TODO optimize these queries
   const players = await db('stars_players')
      .where({ star_name: star.star_name })
      .select('player_name as name', 'next_star');

   const incomingPlayers = await db('stars_players')
      .where({ next_star: star.star_name })
      .select('player_name as name', 'star_name as star');

   const ais = await db('stars_ais')
      .where({ star_name: star.star_name })
      .select('ai_name as name', 'player_name as player');

   const factions = await db('stars_factions')
      .where({ star_name: star.star_name })
      .select('faction_name as name', 'influence');

   const edges = await db('stars_edges')
      .where({ star_a: star.id })
      .select('star_b');

   return { players, ais, factions, incomingPlayers, edges: edges.map(e => e.star_b) };
}

router.get('/', async ctx => {
   const stars = await db('stars').select('id', 'star_name', 'position');

   ctx.body = await Promise.all(
      stars.map(async star => ({
         id: star.id,
         name: star.star_name,
         position: JSON.parse(star.position),
         ...await extraStarInfo(star),
      }))
   );
});

router.get('/:name', async ctx => {
   const star = await db('stars')
      .where({ star_name: ctx.params.name })
      .first('id', 'star_name', 'faction');

   if(star == null) return ctx.status = 404;

   ctx.body = {
      ...star,
      ...await extraStarInfo(star),
   };
});

router.post('/:name/enter', async ctx => {
   const { name } = ctx.params;
   await db.transaction(async tsx => {
      await tsx('stars_players')
         .insert({
            star_name: name,
            next_star: name,
            player_name: ctx.player.name,
         })
         .onConflict(['player_name']).merge(['next_star']);

      ctx.body = { success: true };
   });
});

router.get('/:name/ai', async ctx => {
   ctx.body = await db('stars_ais')
      .where({ star_name: ctx.params.name })
      .select('id', 'ai_name', 'player_name', 'build_bar');
});

router.get('/:name/ai/:id', async ctx => {
   ctx.body = await db('stars_ais')
      .where({ id: parseInt(ctx.params.id) })
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
            id: parseInt(ctx.params.id),
            player_name: ctx.player.name,
         })
         .delete();

      ctx.body = { success: count > 0 };
   });
});

export default router;
