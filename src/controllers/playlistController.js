const prisma = require("../config/database");

// GET /api/playlist/:deviceId
const getPlaylist = async (request, reply) => {
  try {
    const { deviceId } = request.params;

    // Find device
    const device = await prisma.device.findUnique({
      where: { deviceId },
      include: {
        deviceAds: {
          include: { ad: true },
          where: {
            OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
            AND: [
              {
                OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
              },
            ],
          },
        },
      },
    });

    if (!device) {
      return reply.code(404).send({
        success: false,
        error: "Device not found",
      });
    }

    // Group ads by screen
    const screen0Ads = device.deviceAds
      .filter((da) => da.screen === 0)
      .map((da) => ({
        id: da.ad.id,
        type: da.ad.type,
        url: da.ad.url,
        duration: da.ad.duration,
        priority: da.priority,
      }));

    const screen1Ads = device.deviceAds
      .filter((da) => da.screen === 1)
      .map((da) => ({
        id: da.ad.id,
        type: da.ad.type,
        url: da.ad.url,
        duration: da.ad.duration,
        priority: da.priority,
      }));

    // Update device last seen
    await prisma.device.update({
      where: { deviceId },
      data: { lastSeen: new Date(), status: "online" },
    });

    return reply.send({
      success: true,
      device_id: deviceId,
      screen_0: {
        ads: screen0Ads,
      },
      screen_1: {
        ads: screen1Ads,
      },
      refresh_interval: 300,
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      error: "Failed to generate playlist",
    });
  }
};

module.exports = { getPlaylist };
