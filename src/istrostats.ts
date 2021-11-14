import { httpRequest } from 'utils';

const API_URL = process.env.ISTROSTATS_API ?? 'http://istrostats.r26.me/api';

interface Player {
   id: number;
   name: string;
   rank: number;
   faction?: string;
   color: string;
   mode?: string;
   servers: string[];
   ai: boolean;
   logonTime?: number;
   lastActive?: number;
}

export async function player(name: string): Promise<Player | null> {
   const data = await httpRequest(API_URL + '/player?ai=false&name=' + name);
   if(data.count > 0) {
      return data.players[0];
   }
   return null;
}
