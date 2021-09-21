import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
   await knex.transaction(async tsx => {
      await tsx.schema

      .createTable('stars', table => {
         table.increments('id');
         table.string('name').notNullable();
         table.string('faction').index();
      })

      .createTable('stars_players', table => {
         table.increments('id');
         table.integer('stars_id').notNullable().references('stars.id').onDelete('CASCADE');
         table.string('name').notNullable().index();
         table.enu('side', ['attack', 'defend']).notNullable();
      });

      .createTable('stars_ais', table => {
         table.increments('id');
         table.integer('stars_id').notNullable().references('stars.id').onDelete('CASCADE');
         table.string('name').notNullable();
         table.string('player_name').notNullable().index();
         table.string('hash').notNullable().index();
         table.string('buildBar').notNullable();
      });
   });
}


export async function down(knex: Knex): Promise<void> {
   await knex.transaction(async tsx => {
      await tsx.schema
         .dropTableIfExists('stars_ais')
         .dropTableIfExists('stars_players')
         .dropTableIfExists('stars');
   });
}

