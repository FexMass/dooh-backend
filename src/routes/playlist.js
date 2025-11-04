const { getPlaylist } = require("../controllers/playlistController");

async function playlistRoutes(fastify, options) {
  // GET /api/playlist/:deviceId (public - for Android devices)
  fastify.get("/:deviceId", getPlaylist);
}

module.exports = playlistRoutes;
