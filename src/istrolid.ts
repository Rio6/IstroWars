import WebSocket from 'ws';
import EventEmitter from 'events';

const ROOT_ADDR = 'ws://198.199.109.223:88';

type EventListener<T> = (event: T) => void;

export interface ChatMessage {
   text: string;
   name: string;
   color: string;
   channel?: string;
}

export interface PlayerReport {
   name: string;
   side: string;
   hash: string;
   ai: boolean;
}

export interface GameReport {
   serverName: string;
   ranked: boolean;
   time: number;
   type: string;
   winningSide: string;
   players: PlayerReport[];
   channel: string;
}

export default class Istrolid extends EventEmitter {

   ws!: WebSocket;
   rootAddr: string;

   constructor(rootAddr: string = ROOT_ADDR) {
      super()
      this.rootAddr = rootAddr;
      this.connect();
   }

   connect() {
      if(this.ws) {
         this.ws.close();
      }

      this.ws = new WebSocket(this.rootAddr);

      this.ws.on('open', () => this.send('registerBot'));
      this.ws.on('close', () => setTimeout(this.connect, 1000));
      this.ws.on('error', err => this.emit('error', err));

      this.ws.on('message', json => {
         const [name, data] = JSON.parse(json.toString());
         if(typeof name === 'string') {
            this.emit.apply(this, [name, data]);
         }
      });
   }

   send(...args: any[]) {
      this.ws.send(JSON.stringify(args));
   }

   // Static method used by web instance to login players
   static checkPlayer(name: string, gameKey: string, rootAddr = ROOT_ADDR): Promise<boolean> {
      return new Promise((resolve, reject) => {
         const ws = new WebSocket(rootAddr);

         ws.on('error', reject);
         ws.on('open', () => ws.send(JSON.stringify(['checkPlayer', name, gameKey])));
         ws.on('close', () => resolve(false));

         ws.on('message', msg => {
            const [msgType, res] = JSON.parse(msg.toString());
            if(res.name == name) {
               switch(msgType) {
                  case 'playerValid':
                     resolve(true);
                     ws.close();
                     break;
                  case 'playerInvalid':
                     resolve(false);
                     ws.close();
                     break;
               }
            }
         });

         setTimeout(() => ws.close(), 3000);
      });
   }

   // Typings
   on(event: 'error', listener: EventListener<WebSocket.ErrorEvent>): this;
   on(event: 'message', listener: EventListener<ChatMessage>): this;
   on(event: 'gameReport', listener: EventListener<GameReport>): this;
   on(event: string, listener: EventListener<any>): this {
      super.on(event, listener);
      return this;
   }
}
