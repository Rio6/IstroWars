// variables from istrolid
declare const ui: Record<string, any>;
declare const v2: Record<string, any>;
declare const chat: Record<string, any>;
declare const onecup: Record<string, any>;
declare const control: Record<string, any>;
declare const commander: Record<string, any>;
declare const baseAtlas: Record<string, any>;

declare class GalaxyMode {
   zoom: number;
   focus: [number, number];
   mouse: [number, number];
   moving: boolean;
   controls(): void;
   toGameSpace(pos: [number, number]): [number, number];
}

interface Window {
   [key: string]: any;
}

interface Star {
   id: number;
   name: string;
   position: [number, number];
   players: { name: string }[];
   ais: { name: string, player: string }[];
   edges: number[];
}

window.IstroWarsMode = class IstroWarsMode extends GalaxyMode {

   static API_URL = 'http://localhost:8000/api';
   static UPDATE_INTERVAL = 30000;

   static instance: IstroWarsMode;

   // for IstroWars
   stars: { [id: number]: Star } = {};
   hoverStarId: number = -1;
   menuStarId: number = -1;
   lastUpdate: number = 0;
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
   }

   async update() {
      const res = await fetch(IstroWarsMode.API_URL + '/stars');
      if(res.status !== 200) return;
      const stars = await res.json();

      this.stars = {};
      for(const star of stars) {
         this.stars[star.id] = star;
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

   ui() {
      const o = onecup;

      o.div(() => {
         o.position('absolute');
         o.left(0); o.right(0); o.top(0); o.bottom(0);
         o.color('white');
         ui.topButton('menu');

         o.div('.hover-black', () => {
            o.display('inline-block');
            o.height(64);
            o.width(64);
            o.position('relative');
            o.img({
               src: 'img/ui/campaign.png',
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
               o.text('Campaign');
            });
            o.onclick(() => ui.go('galaxy'));
         });
      });

      if(this.menuStarId in this.stars) {
         const star = this.stars[this.menuStarId];
         o.div(() => {
            o.position('absolute');
            o.top(0);
            o.left('calc(50% - 250px)');
            o.width(500);
            o.height('100%');

            o.color('white');
            o.background('rgba(0, 0, 0, .8)');

            o.text_align('center');
            o.font_size(20);
            o.padding('0.5em 0 0');

            o.img('.hover-white', {
               src: 'img/ui/back.png',
            }, () => {
               o.position('absolute');
               o.left(0); o.top(0);
               o.onclick(() => this.menuStarId = -1);
            });

            o.h1(() => o.text(star.name));

            o.text('Commanders');

            o.div(() => {
               o.margin('1em 2em');

               for(const player of star.players) {
                  let name = player.name;
                  if(chat.players[name]) {
                     name = `[${chat.players[name].faction}] ${name}`;
                  }
                  o.text(name);
               }
            });

            o.div('.hover-white', () => {
               o.position('absolute');
               o.bottom(0);
               o.width('100%');
               o.padding('2em');

               if(star.players.find(p => p.name === commander.name)) {
                  o.text('Leave System');
                  o.onclick(() => {
                     this.postAPI(`/stars/${star.name}/leave`)
                        .then(() => this.update())
                        .catch(console.error);
                  });
               } else {
                  o.text('Enter System');
                  o.onclick(() => {
                     this.postAPI(`/stars/${star.name}/enter`)
                        .then(() => this.update())
                        .catch(console.error);
                  });
               }
            });
         });
      }
   }

   tick() {
      this.controls();

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

      // draw edges
      if(this.hoverStarId in this.stars) {
         const star = this.stars[this.hoverStarId];
         for(const edge of star.edges) {
            const other = this.stars[edge];
            if(!other) continue;
            const offset = this.tempv2;
            v2.sub(other.position, star.position, offset);
            const rot = v2.angle(offset);
            const d = v2.mag(offset) / 437;
            v2.scale(offset, .5)
            v2.add(offset, star.position)
            baseAtlas.drawSprite(
               'img/laser01.png',
               offset,
               [.2, d],
               rot,
               [255, 255, 255, 255]
            );
         }
      }

      // draw stars
      for(const star of this.starsList()) {
         const color = star.players.find(p => p.name === commander.name)
            && [46, 204, 113, 255]
            || [255, 255, 255, 255];

         baseAtlas.drawSprite(
            'img/galaxy/star.png',
            star.position,
            [1, 1],
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
         this.menuStarId = this.hoverStarId;
         onecup.refresh();
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
   }
}

window.IstroWarsMode.instance = new window.IstroWarsMode();
