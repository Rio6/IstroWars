import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('stars').del();

    // Inserts seed entries
    await knex('stars').insert([
        { name: 'Akana' },
        { name: 'Drakon' },
        { name: 'Turon' },
    ]);
};
