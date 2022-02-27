import Router from '@koa/router'

import db, { Star } from 'db';
import { toInt } from 'utils';

const router = new Router()

const starQuery = db('stars')
   .leftJoin({ 'players': 'stars_players' }, 'stars.id', 'players.star_id')
   .leftJoin({ 'incoming_players': 'stars_players' }, 'stars.id', 'incoming_players.next_star_id')
   .leftJoin('stars_ais', 'stars.id', 'stars_ais.star_id')
   .leftJoin('stars_factions', 'stars.id', 'stars_factions.star_id')
   .leftJoin('stars_edges', 'stars.id', 'stars_edges.star_a')
   .select(
      'stars.id',
      'stars.star_name',
      'stars.position',
      'stars.control_faction',
      { player_name: 'players.player_name' },
      { player_next_star: 'players.next_star_id' },
      { incoming_name: 'incoming_players.player_name' },
      { incoming_star: 'incoming_players.star_id' },
      { ai_name: 'stars_ais.ai_name' },
      { ai_player: 'stars_ais.player_name' },
      { ai_build_bar: 'stars_ais.build_bar' },
      { ai_hash: 'stars_ais.hash' },
      { faction_name: 'stars_factions.faction_name' },
      { faction_influence: 'stars_factions.influence' },
      { edge: 'star_b' }
   );

function reduceStar(stars: Awaited<typeof starQuery>) {
   const tryAdd = <T>(obj: T, key: keyof T, args: T[keyof T]) => {
      if(obj == null) {
         obj = {} as T;
      }
      if(key != null && obj[key] == null) {
         obj[key] = args;
      }
      return obj;
   };

   return Object.values(stars.reduce((newstars, star) => {
      const newstar = tryAdd(newstars, star.id, {
         id: star.id,
         name: star.star_name,
         position: JSON.parse(star.position),
         controlFaction: star.control_faction,
      })[star.id];

      newstar.players = tryAdd(newstar.players, star.player_name, {
         name: star.player_name,
         next_star: star.player_next_star,
      });

      newstar.incomingPlayers = tryAdd(newstar.incomingPlayers, star.incoming_name, {
         name: star.incoming_name,
         star: star.incoming_star,
      });

      newstar.ais = tryAdd(newstar.ais, star.ai_name, {
         name: star.ai_name,
         player: star.ai_player,
         build_bar: star.ai_build_bar,
         hash: star.ai_hash,
      });

      newstar.factions = tryAdd(newstar.factions, star.faction_name,{
         name: star.faction_name,
         influence: star.faction_influence,
      });

      newstar.edges = tryAdd(newstar.edges, star.edge, star.edge);

      return newstars;
   }, Object.create(null)))
   .map((star: any) => {
      for(const key of ['players', 'incomingPlayers', 'ais', 'factions', 'edges']) {
         if(star[key] && Object.keys(star[key]).length > 0) {
            star[key] = Object.values(star[key]);
         } else {
            delete star[key];
         }
      }
      return star;
   });
}

router.get('/', async ctx => {
   const stars = await starQuery;
   ctx.body = reduceStar(stars);
});

router.post('/:id/enter', async ctx => {
   const destStar = toInt(ctx.params.id);

   const success = await db.transaction(async tsx => {
      const dbStar = await tsx('stars_players')
         .where({ 'player_name': ctx.player.name })
         .leftJoin('stars_edges', 'star_a', 'star_id')
         .select('star_id', 'star_b');

      const edges = dbStar.map(s => s.star_b);
      const srcStar: number | undefined = dbStar[0]?.star_id;

      if(srcStar == null) {
         await tsx('stars_players')
            .insert({
               star_id: destStar,
               player_name: ctx.player.name,
            })
            .onConflict(['player_name']).ignore();
         return true;
      }

      if(srcStar === destStar) {
         await tsx('stars_players')
            .where({ player_name: ctx.player.name })
            .update({
               star_id: srcStar,
               next_star_id: null,
            });
         return true;
      }

      if(srcStar != null && !edges.includes(destStar)) {
         return false;
      }

      await tsx('stars_players')
         .where({ star_id: srcStar })
         .update({
            next_star_id: destStar,
            player_name: ctx.player.name,
         });

      return true;
   });

   ctx.body = { success };
});

export default router;
