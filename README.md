# IstroWars

Work in progress clan wars in [Istrolid](http://www.istrolid.com).

# Current Rules
- Each player can plot to move to an adjacent star, the movement is performed
  at the end of each day.
- When players from the same star wins a battle, the influence of factions on
  that star increases if the winning players wears their faction tag.
- When a faction's influence reaches 80% on a star, it expands into one
  adjacent star.
- When a faction's influence drops to 5%, they are kicked from the star.
- When there are less than 20 factions on the map and there exists stars with
  no factions, a new faction gets added.
- There's no anti-farming measures right now, so it's basically a farming game :P

# Code Overview
Currently, there are three components in IstroWars:
- Game logger
- Web server
- Tick runner
- UI as an Istrolid mod

The game logger in `src/logger` listens to game events and update the database.

The web server in `src/web` contains a REST API for clients to query and update the database.
It also serves the static files, including the modding script.

The tick runner runs everyday and it handles faction expansion, player movement, etc.

The UI script in `src/ui` communicates with the server through REST and displays a UI in game.

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
onecup.script({ src: "http://localhost:8000/js/ui/mod.js", crossOrigin: "anonymous"})
```
