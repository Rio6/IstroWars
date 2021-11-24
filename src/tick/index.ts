import db from 'db';

async function tick() {
   await db.transaction(async tsx => {
      await tsx('stars_players')
         .update({
            star_id: tsx.raw('??', 'next_star_id'),
            next_star_id: null,
         })
         .whereNotNull('next_star_id');
   });

   db.destroy();
}

tick().catch(console.error);
