import { knex } from 'knex';

declare module 'knex/types/tables' {
  interface Star {
    id: number;
    name: string;
    faction: string;
  }

  interface StarsPlayer {
    id: number;
    star_name: string;
    player_name: string;
    side: 'attack' | 'defend';
  }

  interface StarsAI {
    id: number;
    star_name: string;
    ai_name: string;
    player_name: string;
    hash: string;
    build_bar: any;
  }
  
  interface Tables {
    stars: Star;
    stars_players: StarsPlayer;
  }
}
