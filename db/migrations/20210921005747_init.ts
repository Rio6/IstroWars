import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
   await knex.transaction(async tsx => {
      await tsx.schema

         .createTable('stars', table => {
            table.increments('id');
            table.string('name').notNullable().index().unique();
            table.string('faction').index();
            table.jsonb('position').notNullable();
         })

         .createTable('stars_players', table => {
            table.increments('id');
            table.string('star_name').notNullable().index().references('stars.name').onDelete('CASCADE');
            table.string('player_name').notNullable();
            table.unique(['star_name', 'player_name']);
         })

         .createTable('stars_ais', table => {
            table.increments('id');
            table.string('star_name').notNullable().index().references('stars.name').onDelete('CASCADE');
            table.string('ai_name').notNullable();
            table.string('player_name').notNullable().index();
            table.string('hash').notNullable().index();
            table.jsonb('build_bar').notNullable();
            table.unique(['star_name', 'player_name', 'hash']);
         })

         .createTable('stars_factions', table => {
            table.increments('id');
            table.string('star_name').notNullable().index().references('stars.name').onDelete('CASCADE');
            table.string('faction_name').notNullable().index();
            table.float('influence', 4, 4);
            table.unique(['star_name', 'faction_name']);
         })

         .createTable('stars_edges', table => {
            table.integer('star_a').notNullable().index().references('stars.id').onDelete('CASCADE');
            table.integer('star_b').notNullable().references('stars.id').onDelete('CASCADE');
         });
   });
}


export async function down(knex: Knex): Promise<void> {
   await knex.transaction(async tsx => {
      await tsx.schema
         .dropTableIfExists('stars_edges')
         .dropTableIfExists('stars_factions')
         .dropTableIfExists('stars_ais')
         .dropTableIfExists('stars_players')
         .dropTableIfExists('stars');
   });
}

