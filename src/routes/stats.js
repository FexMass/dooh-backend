const { create } = require("../controllers/statsController");

async function statsRoutes(fastify, options) {
  // POST /api/stats (public - for Android devices)
  fastify.post("/", create);
}

module.exports = statsRoutes;
