const authController = require("../controllers/authController");

async function authRoutes(fastify, options) {
  // POST /api/auth/login
  fastify.post("/login", authController.login);

  // POST /api/auth/logout (protected)
  fastify.post("/logout", async (request, reply) => {
    try {
      await request.jwtVerify();
      return authController.logout(request, reply);
    } catch (err) {
      return reply.code(401).send({
        success: false,
        error: "Unauthorized",
      });
    }
  });

  // GET /api/auth/me (get current user)
  fastify.get("/me", async (request, reply) => {
    try {
      await request.jwtVerify();
      return authController.getCurrentUser(request, reply);
    } catch (err) {
      return reply.code(401).send({
        success: false,
        error: "Unauthorized",
      });
    }
  });
}

module.exports = authRoutes;
