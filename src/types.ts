import { knex } from 'knex';

export interface Star {
  id: number;
  name: string;
  faction: string;
}

export interface StarsPlayer {
  id: number;
  star_name: string;
  player_name: string;
  side: 'attack' | 'defend';
}

export interface StarsAI {
  id: number;
  star_name: string;
  ai_name: string;
  player_name: string;
  hash: string;
  build_bar: any;
}

declare module 'knex/types/tables' {
  interface Tables {
    stars: Star;
    stars_players: StarsPlayer;
  }
}
