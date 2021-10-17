import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('stars').del();

    // Inserts seed entries
    await knex('stars').insert([
        { id:  1, star_name: 'Akana',   position: '[ 0,   0]' },
        { id:  2, star_name: 'Alki',    position: '[ 0, 100]' },
        { id:  3, star_name: 'Arcon',   position: '[ 0, 200]' },
        { id:  4, star_name: 'Azee',    position: '[ 0, 300]' },
        { id:  5, star_name: 'Boyar',   position: '[ 0, 400]' },
        { id:  6, star_name: 'Chimera', position: '[ 0, 500]' },
        { id:  7, star_name: 'Drakon',  position: '[ 0, 600]' },
        { id:  8, star_name: 'Denz',    position: '[ 0, 700]' },
        { id:  9, star_name: 'Frox',    position: '[ 0, 800]' },
        { id: 10, star_name: 'Laz',     position: '[ 0, 900]' },
        { id: 11, star_name: 'Kozak',   position: '[100,   0]' },
        { id: 12, star_name: 'Mir',     position: '[200,   0]' },
        { id: 13, star_name: 'Moss',    position: '[300,   0]' },
        { id: 14, star_name: 'Phoenix', position: '[400,   0]' },
        { id: 15, star_name: 'Quar',    position: '[500,   0]' },
        { id: 16, star_name: 'Turon',   position: '[600,   0]' },
    ]);

    const connect = (a: number, b: number) => [{ star_a: a, star_b: b}, { star_a: b, star_b: a}];

    await knex('stars_edges').insert([
        ...connect(1, 2),
        ...connect(2, 3),
        ...connect(3, 4),
        ...connect(4, 5),
        ...connect(5, 6),
        ...connect(6, 7),
        ...connect(7, 8),
        ...connect(8, 9),
        ...connect(9, 10),
        ...connect(1, 11),
        ...connect(11, 12),
        ...connect(12, 13),
        ...connect(13, 14),
        ...connect(14, 15),
        ...connect(15, 16),
    ]);
};
