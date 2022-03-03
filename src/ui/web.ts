async function refresh() {
   const container = document.getElementById('factions');
   if(!container) return;

   const stars = await fetch('/api/stars').then(res => res.json());

   const factions: {
      [name: string]: {
         name: string,
         influence: number,
         controlling: boolean,
      }[]
   } = {};

   for(const star of stars) {
      for(const faction of star.factions ?? []) {
         (factions[faction.name] ?? (factions[faction.name] = [])).push({
            name: star.name,
            influence: faction.influence,
            controlling: faction.name == star.controlFaction,
         });
      }
   }

   const factionList = Object.entries(factions)
      .sort(([_, a], [__, b]) => {
      if(b.length !== a.length) {
         return b.length - a.length;
      }
      return b.reduce((rst, faction) => rst + faction.influence, 0)
           - a.reduce((rst, faction) => rst + faction.influence, 0);
   }).slice(0, 10);

   container.replaceChildren(...factionList.map(([name, stars]) => {
      const elem = document.createElement('div');
      elem.innerHTML = `
         <details class="faction-info">
            <summary>
               <span class="faction-name">${name}</span>
               <span class="star-count">${stars.length} stars</span>
            </summary>
            ${stars.map(s => `
               <div class="star-info">
                  <span class="star-name">${s.name}</span>
                  <span class="star-influence">${s.influence}%</span>
               </div>
            `).join('')}
         </details>
      `;
      return elem;
   }));
}
