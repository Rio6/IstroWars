import Istrolid from 'istrolid';
import * as istrostats from 'istrostats';
import db from 'db';

function asyncMap<T, R>(items: T[], fn: (t: T) => Promise<R>) {
   return Promise.all(items.map(fn));
}

function main() {
   const istro = new Istrolid();

   istro.on('error', console.error);

   istro.on('gameReport', async report => {
      if(!report.winningSide) return;

      // Grab more player info from istrostats
      const players = (await asyncMap(report.players, async player => {
         const playerInfo = await istrostats.player(player.name);
         if(playerInfo) {
            return {
               ...playerInfo,
               winner: player.side === report.winningSide,
            };
         }
      })).filter(p => p && p.faction);

      if(players.length === 0) return;

      await db.transaction(tsx => asyncMap(players, async player => {
         player = player!; // convince ts player is not null

         const change = (player.winner ? 0.1 : -0.1);

         const info = await tsx('stars_players')
            .select('stars_players.star_id', 'influence')
            .join('stars_factions', 'stars_factions.star_id', 'stars_players.star_id')
            .where({
               player_name: player.name,
               faction_name: player.faction,
            })
            .first();

         if(!info) return;

         const newInfluence = Math.min(1, Math.max(0, info.influence + change));
         await tsx('stars_factions')
            .where({
               star_id: info.star_id,
               faction_name: player.faction,
            })
            .update('influence', newInfluence);
      }));
   });

   console.log("Logger running");
}

main();
