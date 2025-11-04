const prisma = require("../config/database");

const deviceController = {
  // POST /api/devices/register (public - for Android)
  register: async (request, reply) => {
    try {
      const {
        deviceId,
        name,
        locationName,
        locationAddress,
        androidVersion,
        gpsLatitude,
        gpsLongitude,
      } = request.body;

      if (!deviceId || !name || !locationName) {
        return reply.code(400).send({
          success: false,
          error: "deviceId, name, and locationName are required",
        });
      }

      // Check if device already exists
      let device = await prisma.device.findUnique({
        where: { deviceId },
      });

      if (device) {
        // Update existing device
        device = await prisma.device.update({
          where: { deviceId },
          data: {
            name,
            locationName,
            locationAddress,
            androidVersion,
            ...(gpsLatitude && { gpsLatitude: parseFloat(gpsLatitude) }),
            ...(gpsLongitude && { gpsLongitude: parseFloat(gpsLongitude) }),
            status: "online",
            lastSeen: new Date(),
          },
        });
      } else {
        // Create new device
        device = await prisma.device.create({
          data: {
            deviceId,
            name,
            locationName,
            locationAddress,
            androidVersion,
            ...(gpsLatitude && { gpsLatitude: parseFloat(gpsLatitude) }),
            ...(gpsLongitude && { gpsLongitude: parseFloat(gpsLongitude) }),
            status: "online",
          },
        });
      }

      return reply.send({
        success: true,
        device,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to register device",
      });
    }
  },

  // POST /api/devices/:id/heartbeat (public - for Android)
  heartbeat: async (request, reply) => {
    try {
      const { id } = request.params;
      const { batteryLevel } = request.body;

      const device = await prisma.device.update({
        where: { deviceId: id },
        data: {
          status: "online",
          lastSeen: new Date(),
          ...(batteryLevel !== undefined && {
            batteryLevel: parseInt(batteryLevel),
          }),
        },
      });

      return reply.send({
        success: true,
        device,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Heartbeat failed",
      });
    }
  },

  // GET /api/devices (protected)
  getAll: async (request, reply) => {
    try {
      const devices = await prisma.device.findMany({
        orderBy: { lastSeen: "desc" },
        include: {
          _count: {
            select: { deviceAds: true, stats: true },
          },
        },
      });

      // Mark devices offline if not seen in 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const devicesWithStatus = devices.map((device) => ({
        ...device,
        status: device.lastSeen > tenMinutesAgo ? "online" : "offline",
      }));

      return reply.send({
        success: true,
        devices: devicesWithStatus,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch devices",
      });
    }
  },

  // GET /api/devices/:id (protected)
  getById: async (request, reply) => {
    try {
      const { id } = request.params;

      const device = await prisma.device.findUnique({
        where: { id },
        include: {
          deviceAds: {
            include: { ad: true },
          },
        },
      });

      if (!device) {
        return reply.code(404).send({
          success: false,
          error: "Device not found",
        });
      }

      return reply.send({
        success: true,
        device,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch device",
      });
    }
  },

  // POST /api/devices/:id/assign (protected)
  assignAds: async (request, reply) => {
    try {
      const { id } = request.params;
      const { ads } = request.body; // [{ adId, screen, priority, startDate, endDate }]

      if (!Array.isArray(ads)) {
        return reply.code(400).send({
          success: false,
          error: "ads must be an array",
        });
      }

      // Delete existing assignments
      await prisma.deviceAd.deleteMany({
        where: { deviceId: id },
      });

      // Create new assignments
      const deviceAds = await prisma.deviceAd.createMany({
        data: ads.map((ad) => ({
          deviceId: id,
          adId: ad.adId,
          screen: ad.screen,
          priority: ad.priority || "normal",
          startDate: ad.startDate ? new Date(ad.startDate) : null,
          endDate: ad.endDate ? new Date(ad.endDate) : null,
        })),
      });

      return reply.send({
        success: true,
        message: `Assigned ${ads.length} ads to device`,
        deviceAds,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to assign ads",
      });
    }
  },

  // PUT /api/devices/:id (protected)
  updateDevice: async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, locationName, locationAddress, gpsLatitude, gpsLongitude } =
        request.body;

      const device = await prisma.device.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(locationName && { locationName }),
          ...(locationAddress && { locationAddress }),
          ...(gpsLatitude && { gpsLatitude: parseFloat(gpsLatitude) }),
          ...(gpsLongitude && { gpsLongitude: parseFloat(gpsLongitude) }),
        },
      });

      return reply.send({
        success: true,
        device,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update device",
      });
    }
  },

  // DELETE /api/devices/:id (protected)
  deleteDevice: async (request, reply) => {
    try {
      const { id } = request.params;

      await prisma.device.delete({ where: { id } });

      return reply.send({
        success: true,
        message: "Device deleted successfully",
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete device",
      });
    }
  },
};

module.exports = deviceController;
