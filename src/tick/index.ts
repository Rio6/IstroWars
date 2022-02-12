import db from 'db';
import * as istroStats from 'istrostats';
import { shuffArray } from 'utils';

const kickInf = 5;
const spreadInf = 80;
const defNewInf = 50;
const defExpInf = 10;
const maxFactions = 20;

async function tick() {
   try {
      await db.transaction(async tsx => {
         const factions = await tsx('stars_factions')
            .distinct('faction_name')
            .pluck('faction_name');

         // Move players to their next star
         await tsx('stars_players')
            .update({
               star_id: tsx.ref('next_star_id') as any,
               next_star_id: null,
            })
            .whereNotNull('next_star_id');

         // Kick factions with < 5 influence from stars
         await tsx('stars_factions')
            .whereIn('id', q => q.select('id').from('stars_factions').where('influence', '<', kickInf))
            .del();

         /*
          * if there are neibouring factions, expand faction with most influence, at least 80%
          * if no eligible factions, get new one from istrostats
          * if influence are the same between more than one factions, nothing is done
          */
         const emptyStars = await tsx('stars')
            .leftJoin('stars_factions', 'stars.id', 'star_id')
            .groupBy('stars.id')
            .havingRaw('count(??) = 0', 'stars_factions.id')
            .pluck('stars.id');

         const activeFactions = await istroStats.activeFactions(
            factions,
            Math.min(maxFactions - factions.length, emptyStars.length)
         ).then(Object.keys);

         await Promise.all(shuffArray(emptyStars).map(async starId => {
            const nearBy = await tsx('stars')
               .join('stars_edges', 'stars.id', 'star_a')
               .join({ 'nearby': 'stars' }, 'nearby.id', 'star_b')
               .join('stars_factions', 'nearby.id', 'star_id')
               .where('stars.id', starId)
               .where('influence', '>=', spreadInf)
               .where(
                  'influence', '=',
                  tsx('stars_factions').where('star_id', tsx.ref('nearby.id')).max('influence')
               )
               .select('faction_name', 'influence');

            if(nearBy.length === 0 && activeFactions.length > 0) {
               // get a new faction from istrostats
               await tsx('stars_factions')
                  .insert({
                     star_id: starId,
                     faction_name: activeFactions.shift(),
                     influence: defNewInf,
                  });
            } else if(nearBy.length === 1) {
               // expand faction
               await tsx('stars_factions')
                  .insert({
                     star_id: starId,
                     faction_name: nearBy[0].faction_name,
                     influence: defExpInf,
                  });
            }
         }));
      });
   } finally {
      db.destroy();
   }
}

tick().catch(console.error);
