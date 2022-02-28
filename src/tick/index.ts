import db from 'db';
import * as istroStats from 'istrostats';
import { shuffArray } from 'utils';

const kickInf = 5;
const spreadInf = 80;
const defNewInf = 50;
const defExpInf = 10;
const maxFactions = 20;
const maxStarFacions = 5;

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

         // Expand controlling factions with >= 80 influence
         const expansions: {
            [name: string]: {
               faction_name: string,
               from: number,
               to: number,
               target_count: number,
            }[]
         } = await tsx('stars')
               .join('stars_edges', 'stars.id', 'star_a')
               .join({ 'factions': 'stars_factions' }, q => {
                  q.on('stars.id', 'factions.star_id');
                  q.on('stars.control_faction', 'factions.faction_name');
               })
               .join({ 'nearby': 'stars' }, 'nearby.id', 'star_b')
               .leftJoin({ 'nearby_factions': 'stars_factions' }, 'nearby.id', 'nearby_factions.star_id')
               .havingRaw('count(nearby_factions.faction_name) <= ?', maxStarFacions)
               .where('factions.influence', '>=', spreadInf)
               .where(
                  'factions.influence',
                  tsx('stars_factions').where('factions.star_id', tsx.ref('stars.id')).max('influence')
               )
               .whereNotExists(
                  tsx('stars_factions')
                     .where('star_id', tsx.ref('stars.id'))
                     .where('faction_name', tsx.ref('nearby_factions.faction_name'))
               )
               .groupBy('factions.faction_name', 'stars.id', 'nearby.id')
               .select('factions.faction_name', { from: 'stars.id' }, { to: 'nearby.id' })
               .count({ 'target_count': 'nearby_factions.id' })
               .then(rows => rows.reduce((result, row) => {
                  const key: string = (row as any).faction_name;
                  if(result[key] == null) {
                     result[key] = [row];
                  } else {
                     result[key].push(row);
                  }
                  return result;
               }, Object.create(null)));

         if(Object.keys(expansions).length > 0) {
            await tsx('stars_factions').insert(
               Object.entries(expansions).map(([faction, targets]) => {
                  const leastPopulated = targets.reduce((a, b) => a.target_count < b.target_count ? a : b);
                  return {
                     faction_name: faction,
                     star_id: leastPopulated.to,
                     influence: defExpInf,
                  };
               })
            );
         }

         // Populate empty stars
         const emptyStars = await tsx('stars')
            .leftJoin('stars_factions', 'stars.id', 'star_id')
            .groupBy('stars.id')
            .havingRaw('count(stars_factions.id) = 0')
            .pluck('stars.id');
         const needFactions = Math.min(maxFactions - factions.length, emptyStars.length)

         if(needFactions > 0) {
            const activeFactions = await istroStats
               .activeFactions(factions, needFactions)
               .then(Object.keys);
            await tsx('stars_factions').insert(
               shuffArray(activeFactions).map((faction, i) => ({
                  star_id: emptyStars[i],
                  faction_name: faction,
                  influence: defNewInf,
               }))
            );
         }

         // Make factions with highest influence the control faction
         // on stars that are not defended by AI
         const hasNewFactions = await tsx('stars')
            .join('stars_factions', q => {
               q.on('stars.id', 'star_id');
               q.onNull('control_faction')
               q.orOn('stars.control_faction', '!=', 'faction_name')
            })
            .where('stars_factions.id', tsx({ 'factions': 'stars_factions' })
                  .where('factions.star_id', tsx.ref('stars.id'))
                  .orderBy('influence', 'desc')
                  .first('id')
            )
            .select('stars.id', 'stars_factions.faction_name');

         await Promise.all(hasNewFactions.map(async ({ id, faction_name }) => {
            await tsx('stars').where({ id }).update({ control_faction: faction_name });
         }));
      });
   } finally {
      db.destroy();
   }
}

tick().catch(console.error);
