import Istrolid from 'istrolid';

function main() {
   const istro = new Istrolid();

   istro.on('error', console.error);
   istro.on('gameReport', console.log);

   console.log("Logger running");
}

main();
