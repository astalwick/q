Q  (#hackMtl)
=

Q is a collaborative, real-time, pixel art project.

The server is using node.js and redis.  Tiles are stored in Redis.
Communication between client and server is 100% via socket.io.
The client is a backbone app, with the 'sync' function swapped out for Backbone.ioBind, to enable Collection and Model fetch/save via socket.io.

This was a hackathon project, so obviously there are some bugs and, uh, inefficiencies.
Among the most significant performance issues is the initial page load and tile drawing.  When the page loads, every single tile (even empty tiles) in the system is fired down to the client.  The client then needs to convert each tile to a cache canvas, and then finally needs to drawImage each tile canvas to the viewing canvas.  This takes a LONG time.  The right way: tell the client about ONLY those tiles that are modified and in-viewport.

As well, there's some pretty serious inefficiency in how the client sends pixel data to the server.  In fact, if you update a pixel, it sends the full tile.  If you have auto-mirror on, it sends the full tile FOUR TIMES, one for each pixel.

Eventually, the goal would be a truly infinite tileset.

## Libraries
Server
- Node.JS
- Socket.io
- Async.js
- Underscore.js
- Express
- Redis

Client
- Backbone
- Backbone.ioBind
- JQuery
- JQuery.mousewheel
- Socket.io
- Underscore
- FlatUIKit

