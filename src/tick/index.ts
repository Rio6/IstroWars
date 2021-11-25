import db from 'db';

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
      });
   } finally {
      db.destroy();
   }
}

tick().catch(console.error);
