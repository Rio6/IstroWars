import Istrolid from 'istrolid';
import * as istrostats from 'istrostats';
import db from 'db';

function main() {
   const istro = new Istrolid();

   istro.on('error', console.error);

   istro.on('gameReport', async report => {
      if(!report.winningSide) return;

      // Grab more player info from db
      const dbPlayers = await Promise.all(report.players.map(async player => {
         const dbPlayer = player.ai
            ? null
            : await db('stars_players')
               .where({ player_name: player.name })
               .first('star_id');

         return {
            ...player,
            ...(dbPlayer ?? {}),
            winner: player.side === report.winningSide,
         };
      }));

      let star: number | null = null;
      for(const player of dbPlayers) {
         if(player == null || player.star_id == null || player.ai) continue;
         if(!star) {
            star = player.star_id;
         } else if(player.star_id !== star) {
            star = null;
            break;
         }
      }

      if(star == null) return;

      // Get more player info from istrostats
      const players = await Promise.all(dbPlayers.map(async player => {
         const isPlayer = player.ai
            ? null
            : await istrostats.player(player.name);
         return {
            ...player,
            ...(isPlayer ?? {}),
         };
      }));

      // TODO put this somewhere
      const reward = 0.1;
      const loss = 0.1;

      // Calculate influence changes
      const infChanges: { [name: string]: number } = {};

      for(const player of players) {
         if(!player.faction || !player.winner) continue;
         infChanges[player.faction] = (infChanges[player.faction] ?? 0) + reward;
      }

      // Update influence
      await db.transaction(async tsx => {
         await tsx('stars_factions')
            .where('star_id', star)
            .update({
               'influence': tsx.raw(
                  'case faction_name ' +
                  Object.keys(infChanges).map(() => 'when ? then min(influence + ?, 1) ').join('') +
                  'else max(influence - ?, 0) end'
               , [...Object.entries(infChanges).flat(), loss])
            });
      });
   });

   console.log("Logger running");
}

main();
