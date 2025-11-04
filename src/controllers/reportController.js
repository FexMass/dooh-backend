const prisma = require("../config/database");

const reportController = {
  // GET /api/reports/dashboard
  getDashboardStats: async (request, reply) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      // Run ALL queries in parallel
      const [
        viewsToday,
        viewsWeek,
        viewsMonth,
        activeDevices,
        totalDevices,
        topLocations,
        topAds,
        chargingEvents,
        qrScans,
      ] = await Promise.all([
        prisma.stat.count({
          where: { eventType: "view", timestamp: { gte: today } },
        }),
        prisma.stat.count({
          where: { eventType: "view", timestamp: { gte: weekAgo } },
        }),
        prisma.stat.count({
          where: { eventType: "view", timestamp: { gte: monthAgo } },
        }),
        prisma.device.count({ where: { lastSeen: { gte: tenMinutesAgo } } }),
        prisma.device.count(),
        prisma.stat.groupBy({
          by: ["deviceId"],
          where: { eventType: "view", timestamp: { gte: monthAgo } },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 5,
        }),
        prisma.stat.groupBy({
          by: ["adId"],
          where: { eventType: "view", timestamp: { gte: monthAgo } },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 5,
        }),
        prisma.stat.count({
          where: { eventType: "charging_start", timestamp: { gte: monthAgo } },
        }),
        prisma.stat.count({
          where: { eventType: "qr_scan", timestamp: { gte: monthAgo } },
        }),
      ]);

      const topLocationsWithDetails = await Promise.all(
        topLocations.map(async (loc) => {
          const device = await prisma.device.findUnique({
            where: { id: loc.deviceId },
          });
          return {
            deviceId: loc.deviceId,
            locationName: device?.locationName || "Unknown",
            views: loc._count.id,
          };
        })
      );

      const topAdsWithDetails = await Promise.all(
        topAds.map(async (ad) => {
          const adDetails = await prisma.ad.findUnique({
            where: { id: ad.adId },
          });
          return {
            adId: ad.adId,
            name: adDetails?.name || "Unknown",
            views: ad._count.id,
          };
        })
      );

      return reply.send({
        success: true,
        stats: {
          views: { today: viewsToday, week: viewsWeek, month: viewsMonth },
          devices: { active: activeDevices, total: totalDevices },
          topLocations: topLocationsWithDetails,
          topAds: topAdsWithDetails,
          chargingEvents,
          qrScans,
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch dashboard stats",
      });
    }
  },

  // GET /api/reports/monthly
  getMonthlyReport: async (request, reply) => {
    try {
      const { year, month } = request.query;
      const startDate = new Date(
        year || new Date().getFullYear(),
        (month || new Date().getMonth()) - 1,
        1
      );
      const endDate = new Date(
        year || new Date().getFullYear(),
        month || new Date().getMonth(),
        0
      );

      const stats = await prisma.stat.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          device: true,
          ad: true,
        },
      });

      const summary = {
        totalViews: stats.filter((s) => s.eventType === "view").length,
        totalChargingEvents: stats.filter(
          (s) => s.eventType === "charging_start"
        ).length,
        avgViewsPerDay: 0,
        stats,
      };

      const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
      summary.avgViewsPerDay = Math.round(summary.totalViews / days);

      return reply.send({
        success: true,
        report: summary,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to generate monthly report",
      });
    }
  },

  // GET /api/reports/location/:id
  getLocationReport: async (request, reply) => {
    try {
      const { id } = request.params;

      const device = await prisma.device.findUnique({
        where: { id },
        include: {
          stats: {
            include: { ad: true },
            orderBy: { timestamp: "desc" },
          },
        },
      });

      if (!device) {
        return reply.code(404).send({
          success: false,
          error: "Device not found",
        });
      }

      const totalViews = device.stats.filter(
        (s) => s.eventType === "view"
      ).length;
      const totalChargingEvents = device.stats.filter(
        (s) => s.eventType === "charging_start"
      ).length;

      return reply.send({
        success: true,
        report: {
          device,
          totalViews,
          totalChargingEvents,
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to generate location report",
      });
    }
  },

  // GET /api/reports/ad/:id
  getAdReport: async (request, reply) => {
    try {
      const { id } = request.params;

      const ad = await prisma.ad.findUnique({
        where: { id },
        include: {
          stats: {
            include: { device: true },
            orderBy: { timestamp: "desc" },
          },
        },
      });

      if (!ad) {
        return reply.code(404).send({
          success: false,
          error: "Ad not found",
        });
      }

      const totalViews = ad.stats.filter((s) => s.eventType === "view").length;
      const totalChargingEvents = ad.stats.filter(
        (s) => s.eventType === "charging_start"
      ).length;

      return reply.send({
        success: true,
        report: {
          ad,
          totalViews,
          totalChargingEvents,
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to generate ad report",
      });
    }
  },

  // GET /api/reports/export/csv
  exportCSV: async (request, reply) => {
    try {
      const { startDate, endDate } = request.query;

      const stats = await prisma.stat.findMany({
        where: {
          ...(startDate && { timestamp: { gte: new Date(startDate) } }),
          ...(endDate && { timestamp: { lte: new Date(endDate) } }),
        },
        include: {
          device: true,
          ad: true,
        },
        orderBy: { timestamp: "desc" },
      });

      // Generate CSV
      let csv = "Timestamp,Device,Location,Ad,Event Type,Screen,Duration\n";
      stats.forEach((stat) => {
        csv += `${stat.timestamp.toISOString()},${stat.device.name},${
          stat.device.locationName
        },${stat.ad.name},${stat.eventType},${stat.screen},${
          stat.duration || ""
        }\n`;
      });

      reply.header("Content-Type", "text/csv");
      reply.header(
        "Content-Disposition",
        "attachment; filename=dooh-report.csv"
      );
      return reply.send(csv);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to export CSV",
      });
    }
  },
};

module.exports = reportController;
