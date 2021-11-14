import http from 'http';
import { URL } from 'url';
import sha1 from 'sha1';

type Part = {
   name: string,
   pos: [number, number],
   dir: number,
};

type Spec = {
   name: string;
   aiRules: string[];
   parts: Part[];
};

export function httpRequest(_url: string | URL, _data: any = '', opts: object = {}): Promise<any> {
   const url = (_url instanceof URL) ? _url : new URL(_url);
   const data = (typeof _data === 'string') ? _data : JSON.stringify(_data);

   return new Promise((resolve, reject) => {
      const req = http.request({
         path: url.pathname + url.search,
         host: url.host,
         port: url.port,
         method: data && 'GET' || 'POST',
         ...opts,
      }, res => {
         res.setEncoding('utf8');
         res.on('error', reject);

         let msg = '';
         res.on('data', d => msg += d);

         res.on('end', () => {
            if(res.statusCode !== 200) {
               reject(new Error(`httpRequest failed with code ${res.statusCode}. ${msg}`));
            } else {
               try {
                  resolve(JSON.parse(msg));
               } catch(e) {
                  reject(e);
               }
            }
         });
      });

      req.write(data);
      req.end();
   });
}

export function hashAI({ name, buildBar }: { name: string, buildBar: (Spec | string)[] }) {
   if(!Array.isArray(buildBar)) buildBar = [];

   const stringifyPart = (p: Part) => JSON.stringify({
      name: p.name,
      pos: p.pos,
      dir: p.dir,
   });

   let hash = sha1(name)
   for(let spec of buildBar) {
      try {
         spec = JSON.parse(spec as string) as Spec;
      } catch {
         spec = { name: '', aiRules: [], parts: [] };
      }

      hash = sha1(hash + spec.name);

      for(const ai of spec.aiRules.map(ai => JSON.stringify(ai))) {
         hash = sha1(hash + ai);
      }

      for(const part of spec.parts.map(stringifyPart).sort()) {
         hash = sha1(hash + part);
      }
   }

   return hash;
}

export function isDev() {
   return process.env.NODE_ENV !== 'production';
}
