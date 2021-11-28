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
   const data = await httpRequest(API_URL + '/player?ai=false&name=' + encodeURIComponent(name));
   if(data.count > 0) {
      return data.players[0];
   }
   return null;
}

export async function activeFactions(excludes: string[] = [], limit: number = 50): Promise<string[]> {
   let url = API_URL + '/activefactions?limit=' + limit;
   for(const exclude of excludes) {
      url += '&exclude=' + encodeURIComponent(exclude);
   }
   const data = await httpRequest(url);
   return data.factions;
}
