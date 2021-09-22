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

export function hashAI({ name, buildBar }: { name: string, buildBar: (Spec | string)[] }) {
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
