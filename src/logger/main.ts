import { Knex } from 'knex';

import Istrolid from 'istrolid';
import * as istrostats from 'istrostats';
import db from 'db';

async function normalizeInfluence(tsx: Knex.Transaction, star: string) {
   await tsx('stars_factions')
      .where({ star_name: star })
      .where('influence', '<>', 0)
      .update('influence', tsx.raw('max(0, min(1, influence / (select sum(influence) from stars_factions where star_name = ?)))', star));
}

async function changeInfluence(tsx: Knex.Transaction, star: string, faction: string, change: number) {
   await tsx('stars_factions')
      .where({ star_name: star, faction_name: faction })
      .update('influence', tsx.raw('(influence - 1) * (1 + 1 / (influence - 1 + ?))', change));
}

function main() {
   const istro = new Istrolid();

   istro.on('error', console.error);

   istro.on('gameReport', async report => {
      for(const reportPlayer of report.players) {
         const player = await istrostats.player(reportPlayer.name);
         const player = { name: "R26", faction: "R26" };
         if(!player) continue;

         await db.transaction(async tsx => {
            const star = await tsx('stars_players')
               .where('player_name', player.name)
               .first('star_name');

            if(star) {
               await changeInfluence(tsx, star.star_name, player.faction, 0.1);
               await normalizeInfluence(tsx, star.star_name);
            }
         });
      }
   });

   console.log("Logger running");
}

main();
