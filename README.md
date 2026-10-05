# SHINOBI STRIKE - Chakra Arena

Anime-ninja themed browser shooter (Free-Fire-style feel). Offline modes + online 1v1 and FFA Battle Royale.

## Features
- Offline: 1v1 Duel, 2v2 Squad TDM, Battle Royale vs tactical AI (flank, cover, heal, walls, grenades on higher tiers)
- Online: quick 1v1 vs anyone, FFA BR up to 8 players. If nobody is found within 25s the game suggests a bot match.
- Killstreaks: Byakugan scan (3), Scroll drop (5), Meteor jutsu (7). Supply drops, HVT bounties, overtime.
- Sunset village map: torii gates, sakura petals, ramen textures, chakra rails, rooftops, window peeks.

## Run locally
    node server.js        # then open http://localhost:3000
No dependencies. Node 16+.

## Deploy on Render (free)
1. Push this folder to GitHub.
2. Render Dashboard -> New -> Web Service -> pick the repo.
3. Render reads render.yaml automatically (or set manually: Build `npm install`, Start `npm start`).
4. The same URL serves the game and the WebSocket (wss://) - online modes work out of the box.

## Structure
    server.js            zero-dep static file server + hand-rolled WebSocket rooms/matchmaking
    public/index.html    shell + HUD + menus
    public/css/style.css cozy chakra UI
    public/js/game.js    full game client (three.js r128 from CDN)
    public/js/net.js     online transport, queue, bot-match fallback
