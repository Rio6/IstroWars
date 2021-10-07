import { Knex } from 'knex';

import Istrolid from 'istrolid';
import * as istrostats from 'istrostats';
import db from 'db';

async function normalizeInfluence(star: string) {
   await db.transaction(async tsx => {
      await tsx('stars_factions')
         .where({ star_name: star })
         .update('influence', tsx.raw('influence / (select sum(influence) from stars_factions where star_name = ?)', star));
   });
}

function main() {
   const istro = new Istrolid();

   istro.on('error', console.error);

   istro.on('gameReport', async report => {
      for(const reportPlayer of report.players) {
         const player = await istrostats.player(reportPlayer.name);
         console.log(player);
      }
   });

   console.log("Logger running");
}

main();

// (a+x)(1-x)/(1-a-x)
