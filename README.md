# IstroWars

Work in progress clan wars in [Istrolid](http://www.istrolid.com).

# Overview
Currently, there are three components in IstroWars:
- Game logger
- Web server
- UI as Istrolid modding script

The game logger in `src/logger` listens to game events and update the database.

The web server in `src/web` contains a REST API for clients to query and update the database.
It also serves the static files, including the modding script.

The UI script in `src/ui` communicates with the server through REST and displays a UI in game.

There will be another component that updates game state from a timer.

# Local Development
1. Clone the repository
```sh
git clone https://github.com/Rio6/IstroWars.git
cd IstroWars
```

2. Install dependencies and build
```sh
npm ci
npm run build
```

3. Initialize the database
```sh
npm run db migrate:up
npm run db seed:run
```

3. Start the server
```sh
npm run watch
```

4. Load the UI script in game
```javascript
onecup.script({ src: "http://localhost:8000/js/ui/mod.js" });
```
