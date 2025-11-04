const { authenticate } = require("../middleware/auth");
const deviceController = require("../controllers/deviceController");

async function deviceRoutes(fastify, options) {
  // POST /api/devices/register (public - for Android devices)
  fastify.post("/register", deviceController.register);

  // POST /api/devices/:id/heartbeat (public - for Android devices)
  fastify.post("/:id/heartbeat", deviceController.heartbeat);

  // Protected routes (admin only)
  fastify.addHook("preHandler", authenticate);

  // GET /api/devices
  fastify.get("/", deviceController.getAll);

  // GET /api/devices/:id
  fastify.get("/:id", deviceController.getById);

  // POST /api/devices/:id/assign
  fastify.post("/:id/assign", deviceController.assignAds);

  // PUT /api/devices/:id
  fastify.put("/:id", deviceController.updateDevice);

  // DELETE /api/devices/:id
  fastify.delete("/:id", deviceController.deleteDevice);
}

module.exports = deviceRoutes;
