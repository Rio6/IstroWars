import db from 'db';
import * as istroStats from 'istrostats';
import { shuffArray } from 'utils';

async function tick() {
   try {
      await db.transaction(async tsx => {
         // Move players to their next star
         await tsx('stars_players')
            .update({
               star_id: tsx.raw('??', 'next_star_id'),
               next_star_id: null,
            })
            .whereNotNull('next_star_id');

         // Kick factions with < 0.1 influence from stars
         await tsx('stars_factions')
            .whereIn('id', q => q.select('id').from('stars_factions').where('influence', '<', '0.1'))
            .del();

         // Find empty stars and populate them
         const emptyStars = await tsx('stars')
            .leftJoin('stars_factions', 'stars.id', 'star_id')
            .groupBy('stars.id', 'faction_name')
            .having(tsx.raw('count(??)', 'faction_name'), '=', 0)
            .pluck('stars.id');

         shuffArray(emptyStars);

         const factions = await tsx('stars_factions')
            .distinct('faction_name')
            .pluck('faction_name');

         const activeFactions = await istroStats.activeFactions(factions, emptyStars.length).then(Object.keys);

         if(activeFactions.length < emptyStars.length) {
            emptyStars.length = activeFactions.length;
         }

         await tsx('stars_factions')
            .insert(activeFactions.map((faction, i) => ({
               star_id: emptyStars[i],
               faction_name: faction,
               influence: 0.5,
            })));
      });
   } finally {
      db.destroy();
   }
}

tick().catch(console.error);
