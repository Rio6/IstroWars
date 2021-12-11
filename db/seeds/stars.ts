import { Knex } from 'knex';
import { shuffArray } from '../../src/utils';

const numClusters = 6;
const numStars = 80;
const mapRadius = 2000;
const clusterRadius = 500;
const minClusterDist = 1000;
const minStarDist = 100;
const distCost = (dist: number) => 0.2 * dist**3;
const tau = Math.PI * 2;

const baseNames = shuffArray([
    'Akana', 'Alki', 'Arcon', 'Azee', 'Boyar', 'Chimera', 'Drakon', 'Denz',
    'Frox', 'Laz', 'Kozak', 'Mir', 'Moss', 'Phoenix', 'Quar', 'Turon',
]);

const extraNames = shuffArray([
    'Abellona', 'Accunyot', 'Afia', 'Afrodite', 'Ambika', 'Amesat',
    'Ancalagon', 'Aphrodesia', 'Ardea', 'Arundhati', 'Atena', 'Athena',
    'Bantona', 'Batonga', 'Belgat', 'Belindo', 'Bhagiratha', 'Bhagyalaskshmi',
    'Blas', 'Briella', 'Busawe', 'Busta', 'Celosia', 'Chanda', 'Chrystophylax',
    'Crull', 'Discobeez', 'Draca', 'Drago', 'Drayce', 'Eagon', 'Eldraxa',
    'Ename', 'Entano', 'Eostre', 'Eraton', 'Errol', 'Fanny', 'Fantaba',
    'Faranth', 'Favaco', 'Favonat', 'Feronia', 'Flavyol', 'Franth', 'Gaia',
    'Gedeon', 'Getapeca', 'Googla', 'Gyo', 'Ignacia', 'Incitia', 'Ishanvi',
    'Jango', 'Jayashri', 'Jirab', 'Kai', 'Kairos', 'Kathyayini', 'Katia',
    'Latnamy', 'Livanna', 'Livanya', 'Maeve', 'Manbagea', 'Margoba', 'Medcono',
    'Mina', 'Mine', 'Mondog', 'Montague', 'Moon', 'Nachik', 'Nals', 'Namge',
    'Nitya', 'Nungagen', 'Orgata', 'Orinda', 'Percy', 'Prebant', 'Rantan',
    'Rhaegal', 'Rhianna', 'Ruoat', 'Ryoko', 'Ryu', 'Saphira', 'Sarafina',
    'Selene', 'Shemevat', 'Shitala', 'Sigred', 'Sindosa', 'Smaug', 'Spanka',
    'Sulis', 'Terza', 'Tinka', 'Treshandit', 'Tundo', 'Tyran', 'Vesna',
    'Vijayalakshmi', 'Viseron', 'Weeruni', 'Worge',
]);

type Vec2 = [number, number];

class Path {
    nodes: number[] = [];
    length: number = Infinity;

    constructor(nodes: number[] = [], length: number = Infinity) {
        this.nodes = nodes;
        this.length = length;
    }

    extend(node: number, distance: number) {
        return new Path([...this.nodes, node], this.length + distance);
    }
}

function dist(a: Vec2, b: Vec2) {
    return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
}

function randomPos(radius: number, offset: Vec2 = [0, 0]): Vec2 {
    const r = Math.random() * radius;
    const th = Math.random() * tau;
    return [r * Math.cos(th) + offset[0], r * Math.sin(th) + offset[1]];
}

function randomElem<V>(arr: V[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function tooClose(point: Vec2, points: Vec2[], minDist: number) {
    return points.some(p => dist(point, p) < minDist);
}

function pathFind(nodes: Vec2[], start: number) {
    const paths = nodes.map(() => new Path());
    const unvisited = new Set(paths.map((_, i) => i));

    paths[start].length = 0;

    let current = start;
    while(current >= 0) {
        unvisited.delete(current);

        for(const id of unvisited) {
            const newPath = paths[current].extend(id, distCost(dist(nodes[current], nodes[id])));
            if(newPath.length < paths[id].length) {
                paths[id] = newPath;
            }
        }
        
        current = -1;
        unvisited.forEach(id => {
            if(current < 0 || paths[id].length < paths[current].length) {
                current = id;
            }
        });
    }

    return paths;
}

export async function seed(knex: Knex): Promise<void> {
    // Cluster positions
    const clusters: Vec2[] = [];
    for(let i = 0; i < 10000; i++) {
        if(clusters.length >= numClusters) break;
        const cluster = randomPos(mapRadius - clusterRadius);
        if(!tooClose(cluster, clusters, minClusterDist)) {
            clusters.push(cluster);
        }
    }

    // Star positions
    const stars: Vec2[] = [];
    for(let i = 0; i < 10000; i++) {
        if(stars.length >= numStars) break;
        const star = randomPos(clusterRadius, randomElem(clusters));
        if(!tooClose(star, stars, minStarDist)) {
            stars.push(star);
        }
    }

    // Create edges
    const edges = new Set<string>()
    stars.forEach((_, star) => {
        for(const path of pathFind(stars, star)) {
            let prev = star;
            for(const node of path.nodes) {
                edges.add(JSON.stringify([prev, node]));
                edges.add(JSON.stringify([node, prev]));
                prev = node;
            }
        }
    });

    // Update DB
    await knex.transaction(async tsx => {
        // Deletes ALL existing entries
        await tsx('stars').del();
        await tsx('stars_edges').del();
        await tsx('stars_players').del();
        await tsx('stars_factions').del();

        // Add stars
        await tsx('stars').insert([
            ...baseNames.slice(0, stars.length),
            ...extraNames.slice(0, Math.max(0, stars.length - baseNames.length)),
        ].map((star_name, id) => ({
            id,
            star_name,
            position: JSON.stringify(stars[id]),
        })));

        // Add edges
        await tsx.batchInsert('stars_edges', Array.from(edges, edgeStr => {
            const edge = JSON.parse(edgeStr);
            return { star_a: edge[0], star_b: edge[1] };
        }), 100);
    });
};
