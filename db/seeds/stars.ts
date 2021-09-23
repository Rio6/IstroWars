import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('stars').del();

    // Inserts seed entries
    await knex('stars').insert([
        { name: 'Akana',   position: [ 0,  0] },
        { name: 'Alki',    position: [ 0, 10] },
        { name: 'Arcon',   position: [ 0, 20] },
        { name: 'Azee',    position: [ 0, 30] },
        { name: 'Boyar',   position: [ 0, 40] },
        { name: 'Chimera', position: [ 0, 50] },
        { name: 'Drakon',  position: [ 0, 60] },
        { name: 'Denz',    position: [ 0, 70] },
        { name: 'Frox',    position: [ 0, 80] },
        { name: 'Laz',     position: [ 0, 90] },
        { name: 'Kozak',   position: [10,  0] },
        { name: 'Mir',     position: [20, 10] },
        { name: 'Moss',    position: [30, 10] },
        { name: 'Phoenix', position: [40, 10] },
        { name: 'Quar',    position: [50, 10] },
        { name: 'Turon',   position: [60, 10] },
    ]);

    const connect = (a: number, b: number) => [{ star_a: a, star_b: b}, { star_a: b, star_b: a}];

    await knex('stars_edges').insert([
        ...connect(0, 1),
        ...connect(1, 2),
        ...connect(2, 3),
        ...connect(3, 4),
        ...connect(4, 5),
        ...connect(5, 6),
        ...connect(6, 7),
        ...connect(7, 8),
        ...connect(8, 9),
        ...connect(9, 10),
        ...connect(0, 11),
        ...connect(11, 12),
        ...connect(12, 13),
        ...connect(13, 14),
        ...connect(14, 15),
        ...connect(15, 16),
    ]);
};
