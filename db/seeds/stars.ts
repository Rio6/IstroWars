import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('stars').del();

    // Inserts seed entries
    await knex('stars').insert([
        { star_name: 'Akana',   position: '[ 0,  0]' },
        { star_name: 'Alki',    position: '[ 0, 10]' },
        { star_name: 'Arcon',   position: '[ 0, 20]' },
        { star_name: 'Azee',    position: '[ 0, 30]' },
        { star_name: 'Boyar',   position: '[ 0, 40]' },
        { star_name: 'Chimera', position: '[ 0, 50]' },
        { star_name: 'Drakon',  position: '[ 0, 60]' },
        { star_name: 'Denz',    position: '[ 0, 70]' },
        { star_name: 'Frox',    position: '[ 0, 80]' },
        { star_name: 'Laz',     position: '[ 0, 90]' },
        { star_name: 'Kozak',   position: '[10,  0]' },
        { star_name: 'Mir',     position: '[20, 10]' },
        { star_name: 'Moss',    position: '[30, 10]' },
        { star_name: 'Phoenix', position: '[40, 10]' },
        { star_name: 'Quar',    position: '[50, 10]' },
        { star_name: 'Turon',   position: '[60, 10]' },
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
