import { knex } from 'knex';

export interface Star {
  id: number;
  star_name: string;
  faction: string;
}

export interface StarsPlayer {
  id: number;
  star_name: string;
  player_name: string;
  next_star?: string;
}

export interface StarsAI {
  id: number;
  star_name: string;
  ai_name: string;
  player_name: string;
  hash: string;
  build_bar: any;
}

export interface StarsFaction {
  id: number;
  star_name: string;
  faction_name: string;
  influence: number;
}

declare module 'knex/types/tables' {
  interface Tables {
    stars: Star;
    stars_players: StarsPlayer;
    stars_ais: StarsAI;
    stars_factions: StarsFaction;
  }
}
