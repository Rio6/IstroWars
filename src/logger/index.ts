import Istrolid, { PlayerReport } from 'istrolid';
import * as istrostats from 'istrostats';
import db, { StarsPlayer } from 'db';

const rewardInf = 1;
const lossInf = 1;

function main() {
   const istro = new Istrolid();

   istro.on('error', console.error);

   istro.on('gameReport', async report => {
      if(!report.winningSide) return;

      /*
       * skip if not all players + ai are in same star:
       * each player + ai in winning team: influence++
       * each faction not in winning team: influence--
       */

      const players: {
         [name: string]:
            { winner: boolean } &
            PlayerReport &
            Partial<istrostats.Player> &
            Partial<StarsPlayer>
      } = Object.create(null);

      // player info from report
      for(const player of report.players) {
         if(player.ai) continue;
         players[player.name] = {
            ...player,
            winner: player.side === report.winningSide,
         };
      }

      if(Object.keys(players).length <= 1) {
         return;
      }

      // player info from db
      for(const player of await db('stars_players')
         .whereIn('player_name', Object.values(players).filter(p => !p.ai).map(p => p.name))
         .select('player_name', 'star_id'))
      {
         Object.assign(players[player.player_name], player);
      }

      // ai info from db
      /*
      for(const ai of await db('stars_ais')
         .whereIn('hash', Object.values(players).filter(p => p.ai && p.hash).map(p => p.hash))
         .select('ai_name', 'faction_name', 'star_id'))
      {
         if(players[ai.ai_name]) {
            players[ai.ai_name].star_id = ai.star_id;
            players[ai.ai_name].faction = ai.faction_name;
         }
      }
      */

      // check all players are in same star
      let star = -1;
      for(const name in players) {
         const player = players[name];
         if(player.star_id == null) return;
         else if(star < 0) star = player.star_id;
         else if(player.star_id !== star) return;
      }

      // player info from istrostats
      for(const player of await istrostats.players(Object.keys(players))) {
         Object.assign(players[player.name], player);
      }

      // Calculate influence changes
      const infChanges: { [name: string]: number } = {};

      for(const name in players) {
         const player = players[name];
         if(!player.faction || !player.winner) continue;
         infChanges[player.faction!] = (infChanges[player.faction!] ?? 0) + rewardInf;
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
               , [...Object.entries(infChanges).flat(), lossInf])
            });
      });
   });

   console.log("Logger running");
}

main();
