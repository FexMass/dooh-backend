const { authenticate } = require("../middleware/auth");
const adController = require("../controllers/adController");

async function adRoutes(fastify, options) {
  // All ad routes require authentication
  fastify.addHook("preHandler", authenticate);

  // POST /api/ads/upload
  fastify.post("/upload", adController.upload);

  // GET /api/ads
  fastify.get("/", adController.getAll);

  // GET /api/ads/:id
  fastify.get("/:id", adController.getById);

  // DELETE /api/ads/:id
  fastify.delete("/:id", adController.deleteAd);

  // PUT /api/ads/:id
  fastify.put("/:id", adController.updateAd);
}

module.exports = adRoutes;
