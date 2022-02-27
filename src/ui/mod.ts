// variables from istrolid
declare const ui: Record<string, any>;
declare const v2: Record<string, any>;
declare const chat: Record<string, any>;
declare const onecup: Record<string, any>;
declare const control: Record<string, any>;
declare const commander: Record<string, any>;
declare const baseAtlas: Record<string, any>;
declare function simpleEquals<T>(a: T, b: T): boolean;

declare class GalaxyMode {
   zoom: number;
   focus: [number, number];
   mouse: [number, number];
   moving: boolean;
   controls(): void;
   fromGameSpace(pos: [number, number]): [number, number];
   toGameSpace(pos: [number, number]): [number, number];
}

interface Window {
   [key: string]: any;
}

interface Array<T> {
   last(): T | undefined;
}

interface Star {
   id: number;
   name: string;
   position: [number, number];
   controlFaction?: string;
   players: { name: string, next_star?: string }[];
   incomingPlayers: { name: string, star: string }[];
   ais: { name: string, player: string }[];
   factions: { name: string, influence: number }[];
   edges: number[];
}

window.IstroWarsMode = class IstroWarsMode extends GalaxyMode {

   static API_URL = new URL('/api', Array.from(onecup.lookup('script') as HTMLScriptElement[]).last()?.src || 'http://localhost:8000').href;
   static UPDATE_INTERVAL = 60000;

   static instance: IstroWarsMode;

   // for IstroWars
   stars: { [id: number]: Star } = {};
   currentStar?: Star;
   hoverStarId: number = -1;
   menuStarId: number = -1;
   lastUpdate: number = 0;
   showEdges: boolean = false;
   showNames: boolean = false;

   // other stuff
   lastZoom: number = 0;
   lastFocus: [number, number] = [0, 0];
   tempv2: [number, number];

   constructor() {
      super();

      this.focus = v2.create();
      this.tempv2 = v2.create();

      window.body = () => {
         window.istroWars.windowBody();
         if(ui.mode === 'istroWars') {
            control.mode = this;
            control.backgroundMode = this;
            this.ui();
         }
      };

      ui.menu = () => {
         window.istroWars.uiMenu();
         const o = onecup;
         o.after(() => {
            for(const elem of o.lookup('[src="img/ui/menu_campaign.png"]')) {
               const campElem = elem.parentNode;
               campElem.onclick = () => ui.go('istroWars');
               campElem.replaceChild(document.createTextNode('IstroWars'), elem.nextSibling);
            }
         });
      };

      control.escape = () => {
         if(ui.mode === 'istroWars') {
            this.menuStarId = -1;
            onecup.refresh();
         } else {
            window.istroWars.controlEscape();
         }
      };
   }

   formatFaction(star: Star) {
      return star.controlFaction ? `[${star.controlFaction}] ${star.name}` : star.name;
   }

   async update() {
      const res = await fetch(IstroWarsMode.API_URL + '/stars');
      if(res.status !== 200) return;
      const stars = await res.json();

      this.stars = {};
      this.currentStar = undefined;
      for(const star of stars) {
         this.stars[star.id] = star;
         for(const key of ['players', 'incomingPlayers', 'ais', 'factions', 'edges'] as const) {
            if(this.stars[star.id][key] == null) {
               this.stars[star.id][key] = [];
            }
         }
         for(const { name } of star.players) {
            if(name === commander.name) {
               this.currentStar = star;
            }
         }
      }

      onecup.refresh();
   }

   async postAPI(api: string, data?: any) {
      const res = await fetch(IstroWarsMode.API_URL + api, {
         method: 'POST',
         body: data && JSON.stringify(data),
         credentials: 'include',
         headers: {
            'X-Istrowars-Name': commander.name,
            'X-Istrowars-Key': window.rootNet.gameKey,
         },
      });
      return res.json();
   }

   starsList() {
      return Object.values(this.stars);
   }

   starUi() {
      const o = onecup;
      const star = this.stars[this.menuStarId];
      if(star == null) return;

      o.div(() => {
         o.position('absolute');
         o.top(0);
         o.left('calc(50% - 250px)');
         o.width(500);
         o.height('100%');

         o.color('white');
         o.background('rgba(0, 0, 0, .8)');

         o.text_align('center');
         o.font_size(25);
         o.padding('0.5em 0 0');

         o.img('.hover-white', {
            src: 'img/ui/back.png',
         }, () => {
            o.position('absolute');
            o.left(0); o.top(0);
            o.onclick(() => this.menuStarId = -1);
         });

         o.h1(() => o.text(star.name));

         if(star.factions.length > 0) {
            o.text('factions');
            o.div(() => {
               o.font_size(20);

               const factions = star.factions.sort((a, b) => {
                  if(a.name === star.controlFaction) return -Infinity;
                  if(b.name === star.controlFaction) return Infinity;
                  return b.influence - a.influence;
               });

               for(const faction of factions) {
                  o.div(() => {
                     o.position('relative');
                     o.width('90%');
                     o.margin('0 auto')

                     o.div(() => {
                        o.display('inline-block');
                        o.width('5%');
                        o.text_align('right');

                        if(faction.name === star.controlFaction) {
                           o.img({ src: 'img/ui/galaxy/boss.png' }, () => {
                              o.position('relative');
                              o.width('2em');
                              o.top('0.5em');
                           });
                        }
                     });

                     o.div(() => {
                        o.display('inline-block');
                        o.width('20%');
                        o.text_align('right');
                        o.padding('0 1em');
                        o.text(faction.name);
                     });

                     o.div(() => {
                        o.display('inline-block');
                        o.width('50%');
                        o.text_align('left');
                        o.div(() => {
                           o.display('inline-block');
                           o.background('white');
                           o.width(faction.influence + '%');
                           o.height('0.5em');
                           o.vertical_align('middle');
                           o.nbsp();
                        });
                     });

                     o.span(() => {
                        o.display('inline-block');
                        o.width('15%');
                        o.text_align('right');
                        o.text(faction.influence.toFixed(0) + '%');
                     });
                  })
               }
            });
         }

         o.br();


         const rank = (p: typeof star.players[0]) => {
            return chat.players[p.name]?.rank ?? -1;
         };

         if(star.players.length > 0) {
            o.text('commanders');
            o.div(() => {
               o.font_size(20);

               for(const player of star.players.sort((a, b) => rank(b) - rank(a))) {
                  const { name, next_star } = player;
                  o.div(() => {
                     o.width('100%');

                     let text = '';

                     if(chat.players[name]) {
                        const faction = chat.players[name].faction;
                        o.text((faction && `[${faction}] ` || '') + name + (next_star && `-> ${next_star}` || ''));
                        o.color('white');
                     } else {
                        o.text(name + (next_star && ` -> ${next_star}` || ''));
                        o.color('grey');
                     }
                  });
               }
            });
         }

         o.br();

         if(star.incomingPlayers.length > 0) {
            o.text('arriving');
            o.div(() => {
               o.font_size(20);

               for(const player of star.incomingPlayers.sort((a, b) => rank(b) - rank(a))) {
                  const { name, star } = player;
                  o.div(() => {
                     o.width('100%');

                     let text = '';

                     if(chat.players[name]) {
                        const faction = chat.players[name].faction;
                        o.text(`${star} -> ` + (faction && `[${faction}] ` || '') + `${name}`)
                        o.color('white');
                     } else {
                        o.text(`${star} -> ${name}`);
                        o.color('grey');
                     }
                  });
               }
            });
         }

         const isArriving = star.incomingPlayers.some(p => p.name === commander.name);
         const isNearBy = !this.currentStar || star.id !== this.currentStar.id && this.currentStar?.edges.includes(star.id);

         if(isArriving || isNearBy) {
            o.div('.hover-white', () => {
               o.position('absolute');
               o.bottom(0);
               o.width('100%');
               o.padding('2em');

               let destId: number | undefined;
               if(isArriving) {
                  o.text('Cancel Trip');
                  destId = this.currentStar?.id;
               } else {
                  o.text('Enter System');
                  destId = star.id;
               }

               if(destId != null) {
                  o.onclick(() => {
                     this.postAPI(`/stars/${destId}/enter`)
                        .then(() => this.update())
                        .catch(console.error);
                  });
               }
            });
         }
      });
   }

   ui() {
      const o = onecup;

      // Star names
      if(this.showNames) {
         for(const star of this.starsList()) {
            const pos = this.fromGameSpace(star.position);
            o.div(() => {
               o.position('fixed');
               o.left(pos[0]);
               o.top(pos[1]);
               o.white_space('nowrap');
               o.div(() => {
                  o.position('relative');
                  o.top(5);
                  o.left('-50%');
                  o.font_size(Math.min(100 / this.zoom, 100) + '%')
                  o.color('white');
                  o.background('#222');
                  o.box_shadow('0 0 3px #222');
                  o.text(this.formatFaction(star));
               });
            });
         }
      }

      // Bottons
      const topButton = (text: string, img: string, cb: (() => void)) => {
         o.display('inline-block');
         o.height(64);
         o.width(64);
         o.img({
            src: img,
            width:44,
            height:44
         }, () => {
            o.top(0);
            o.left(10);
            o.position('absolute');
         });
         o.div(() => {
            o.position('absolute');
            o.line_height(12);
            o.font_size(12);
            o.text_align('center');
            o.width(64);
            o.top(44);
            o.text(text);
         });
         o.onclick(cb);
      };

      o.div(() => {
         o.position('absolute');
         o.left(0); o.right(0); o.top(0); o.bottom(0);
         o.color('white');
         ui.topButton('menu');

         o.div('.hover-black', () => {
            o.position('relative');
            topButton('Campaign', 'img/ui/campaign.png', () => ui.go('galaxy'));
         });

         o.div('.hover-black', () => {
            o.position('absolute');
            o.right(64);
            topButton('Edges', 'img/ui/galaxy/star.png', () => this.showEdges = !this.showEdges);
         });

         o.div('.hover-black', () => {
            o.position('absolute');
            o.right(0);
            topButton('Names', 'img/ui/galaxy/boss.png', () => this.showNames = !this.showNames);
         });
      });

      // Draw menu
      if(this.menuStarId in this.stars) {
         this.starUi();
      }
   }

   tick() {
      this.controls();

      if(this.showNames && (!simpleEquals(this.focus, this.lastFocus) || this.zoom !== this.lastZoom)) {
         this.lastZoom = this.zoom;
         this.lastFocus = [this.focus[0], this.focus[1]];
         onecup.refresh(); // TODO don't spam track call
      }

      const now = Date.now();
      if(now - this.lastUpdate > IstroWarsMode.UPDATE_INTERVAL) {
         this.update().catch(console.error);
         this.lastUpdate = now;
      }
   }

   draw() {
      baseAtlas.beginSprites(this.focus, this.zoom);

      const zoom = Math.max(window.innerWidth, window.innerHeight) / 128;
      const z = zoom * this.zoom;

      baseAtlas.drawSprite(
         'img/newbg/fill.png',
         [-this.focus[0], -this.focus[1]],
         [z, z],
         0,
         [11, 25, 46, 255],
      );

      baseAtlas.drawSprite(
         'img/bg/galaxy.png',
         [0, 0],
         [2, 2],
         0,
      );

      // draw stars
      for(const star of this.starsList()) {
         const scale = 0.5 + star.edges.length * 0.2;
         const color = star.id === this.currentStar?.id
            ? [46, 204, 113, 255]
            : [255, 255, 255, 255];

         // draw edges
         if(this.showEdges || star.id === this.hoverStarId) {
            for(const edge of star.edges) {
               const other = this.stars[edge];
               if(!other) continue;

               const offset = this.tempv2;
               v2.sub(other.position, star.position, offset);

               const rot = v2.angle(offset);
               const d = v2.mag(offset) / 400;

               v2.scale(offset, .5)
               v2.add(offset, star.position)

               const color = this.currentStar?.id === star.id && other.incomingPlayers.find(p => p.name === commander.name)
                  ? [46, 204, 113, 255]
                  : star.id === this.hoverStarId
                  ? [255, 255, 255, 200]
                  : [255, 255, 255, 30];

               baseAtlas.drawSprite(
                  'img/laser01.png',
                  offset,
                  [.2, d],
                  rot,
                  color,
               );
            }
         }

         // draw star
         baseAtlas.drawSprite(
            `img/galaxy/star.png`,
            star.position,
            [scale, scale],
            0,
            color,
         );
      }
   }

   onmousedown(e: MouseEvent) {
      if(e.which === 2) {
         this.moving = true;
         e.preventDefault();
      }

      if(e.which === 1 && !(this.menuStarId in this.stars)) {
         const update = this.menuStarId != this.hoverStarId;
         this.menuStarId = this.hoverStarId;
         if(update) {
            this.update();
            onecup.refresh();
         }
      }
   }

   onmouseup(e: MouseEvent) {
      this.moving = false;
   }

   onmousemove(e: MouseEvent) {
      if(this.moving) {
         this.focus[0] += e.movementX * this.zoom * 2;
         this.focus[1] -= e.movementY * this.zoom * 2;
      }

      this.mouse = this.toGameSpace([e.clientX, e.clientY]);

      this.hoverStarId = -1;
      for(const star of this.starsList()) {
         if(v2.distance(this.mouse, star.position) < 32) {
            this.hoverStarId = star.id;
            break;
         }
      }
   }
}


// add script to istrolid
if(!window.istroWars) {
   window.istroWars = {
      windowBody: window.body,
      uiMenu: ui.menu,
      controlEscape: control.escape,
   }
}

window.IstroWarsMode.instance = new window.IstroWarsMode();
