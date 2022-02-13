import { httpRequest } from 'utils';

const API_URL = process.env.ISTROSTATS_API ?? 'http://istrostats.r26.me/api';

export interface Player {
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

// assumes # of player to look for < istrostats limit
export async function players(names: string | string[]): Promise<Player[]> {
   if(!Array.isArray(names)) names = [names];
   let url = API_URL + '/player?ai=false';
   for(const name of names) {
      url += '&name=' + encodeURIComponent(name);
   }
   const data = await httpRequest(url);
   return data.players;
}

export async function activeFactions(excludes: string[] = [], limit: number = 50): Promise<string[]> {
   let url = API_URL + '/activefactions?limit=' + limit;
   for(const exclude of excludes) {
      url += '&exclude=' + encodeURIComponent(exclude);
   }
   const data = await httpRequest(url);
   return data.factions;
}
