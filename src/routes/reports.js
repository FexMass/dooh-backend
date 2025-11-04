const { authenticate } = require("../middleware/auth");
const reportController = require("../controllers/reportController");

async function reportRoutes(fastify, options) {
  // All report routes require authentication
  fastify.addHook("preHandler", authenticate);

  // GET /api/reports/dashboard
  fastify.get("/dashboard", reportController.getDashboardStats);

  // GET /api/reports/monthly
  fastify.get("/monthly", reportController.getMonthlyReport);

  // GET /api/reports/location/:id
  fastify.get("/location/:id", reportController.getLocationReport);

  // GET /api/reports/ad/:id
  fastify.get("/ad/:id", reportController.getAdReport);

  // GET /api/reports/export/csv
  fastify.get("/export/csv", reportController.exportCSV);
}

module.exports = reportRoutes;
