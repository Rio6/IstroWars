import db from 'db';

async function tick() {
   await db.transaction(async tsx => {
      await tsx('stars_players')
         .update({
            star_name: tsx.ref('next_star'),
            next_star: null,
         })
         .whereNotNull('next_star');
   });

   db.destroy();
}

tick().catch(console.error);
