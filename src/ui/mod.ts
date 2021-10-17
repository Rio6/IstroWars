// variables from istrolid
declare const ui: Record<string, any>;
declare const v2: Record<string, any>;
declare const onecup: Record<string, any>;
declare const control: Record<string, any>;
declare const baseAtlas: Record<string, any>;

interface Window {
   [key: string]: any;
}

interface Star {
   id: number;
   name: string;
   position: [number, number];
   players: { name: string }[];
   ais: { name: string, player: string}[];
   edges: number[];
}

window.IstroWarsMode = class IstroWarsMode extends window.GalaxyMode {

   static API_URL = 'http://localhost:8000/api';
   static UPDATE_INTERVAL = 5000;

   static instance: IstroWarsMode;

   // from GalaxyMode
   zoom!: number;
   focus!: [number, number];
   mouse!: [number, number];
   controls!: () => void;
   toGameSpace!: (pos: [number, number]) => [number, number];

   // for IstroWars
   stars: {[id: number]: Star} = {};
   hoverStar: Star | null = null;
   menuStar: Star | null = null;
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
         onecup.div(() => {
            onecup.position('absolute');
            onecup.top(80);
            onecup.left(0);
            onecup.img('.hover-black',
               {
                  src: 'img/ui/galaxy/boss.png',
                  width: 64,
                  height: 64,
               },
               () => onecup.onclick(() => ui.go('istroWars'))
            );
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
   }

   starsList() {
      return Object.values(this.stars);
   }

   ui() {
      onecup.div(() => {
         onecup.h1(() => onecup.text('IstroWars'));
         onecup.text_align('center');
         onecup.color('white');
         onecup.width('100%');
      });

      if(this.menuStar) {
         const star = this.menuStar!;
         onecup.div(() => {
            onecup.position('absolute');
            onecup.left(0);
            onecup.right(0);
            onecup.top(0);
            onecup.bottom(0);
            onecup.div(() => {
               onecup.margin('100px auto');
               onecup.width(340);
               onecup.color('white');
               onecup.h1(() => onecup.text(star.name));
               onecup.text('players');
               onecup.ul(() => {
                  for(const player of star.players) {
                     onecup.li(() => onecup.text(player.name));
                  }
               });
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
      if(this.hoverStar) {
         const star = this.hoverStar;
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
         baseAtlas.drawSprite(
            'img/galaxy/star.png',
            star.position,
            [1, 1],
            0,
            [255, 255, 255, 255]
         );
      }
   }

   onmousedown(e: MouseEvent) {
      if(e.which === 2) {
         this.moving = true;
         e.preventDefault();
      }

      this.menuStar = this.hoverStar;
      onecup.refresh();
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

      this.hoverStar = null;
      for(const star of this.starsList()) {
         if(v2.distance(this.mouse, star.position) < 32) {
            this.hoverStar = star;
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
