import { knex } from 'knex';

export interface Star {
   id: number;
   star_name: string;
   faction: string;
}

export interface StarsPlayer {
   id: number;
   star_id: number;
   player_name: string;
   next_star_id: number | null;
}

export interface StarsAI {
   id: number;
   star_id: number;
   ai_name: string;
   player_name: string;
   hash: string;
   build_bar: any;
}

export interface StarsFaction {
   id: number;
   star_id: number;
   faction_name: string;
   influence: number;
}

export interface StarsEdges {
   star_a: number;
   star_b: number;
}

declare module 'knex/types/tables' {
   interface Tables {
      stars: Star;
      stars_players: StarsPlayer;
      stars_ais: StarsAI;
      stars_factions: StarsFaction;
      stars_edges: StarsEdges;
   }
}
