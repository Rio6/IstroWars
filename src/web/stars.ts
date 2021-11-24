import Router from '@koa/router'

import db, { Star } from 'db';
import { hashAI } from 'utils';

const router = new Router()

async function extraStarInfo(star: Pick<Star, 'id'>) {
   // TODO optimize these queries
   const players = await db('stars_players')
      .where({ star_id: star.id })
      .join('stars', 'stars.id', 'star_id')
      .select('player_name as name', 'star_name as next_star');

   const incomingPlayers = await db('stars_players')
      .where({ next_star_id: star.id })
      .join('stars', 'stars.id', 'star_id')
      .select('player_name as name', 'star_name as star');

   const ais = await db('stars_ais')
      .where({ star_id: star.id })
      .select('ai_name as name', 'player_name as player');

   const factions = await db('stars_factions')
      .where({ star_id: star.id })
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
   const { name: star_name } = ctx.params;
   await db.transaction(async tsx => {
      const star = await tsx('stars').select('id').first();
      if(!star) return;
      await tsx('stars_players')
         .insert({
            star_id: star.id,
            next_star_id: star.id,
            player_name: ctx.player.name,
         })
         .onConflict(['player_name']).merge(['next_star_id']);

      ctx.body = { success: true };
   });
});

export default router;
