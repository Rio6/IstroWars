import WebSocket from 'ws';
import EventEmitter from 'events';

const ROOT_ADDR = 'ws://198.199.109.223:88';

export default class Istrolid extends EventEmitter {
   static checkPlayer(name: string, gameKey: string, rootAddr = ROOT_ADDR): Promise<boolean> {
      return new Promise((resolve, reject) => {
         const ws = new WebSocket(rootAddr);

         ws.on('error', reject);
         ws.on('open', () => ws.send(JSON.stringify(['checkPlayer', name, gameKey])));
         ws.on('close', () => resolve(false));

         ws.on('message', msg => {
            const [msgType, res] = JSON.parse(msg.toString());

            switch(msgType) {
               case 'playerValid':
                  if(res.name === name) {
                     resolve(true);
                     ws.close();
                  }
                  break;
               case 'playerInvalid':
                  resolve(false);
                  ws.close;
                  break;
            }
         });

         setTimeout(() => ws.close(), 5000);
      });
   }
}
