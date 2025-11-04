const prisma = require("../config/database");

// POST /api/stats
const create = async (request, reply) => {
  try {
    const { deviceId, adId, eventType, screen, duration, rotationSlot } =
      request.body;

    if (!deviceId || !adId || !eventType || screen === undefined) {
      return reply.code(400).send({
        success: false,
        error: "deviceId, adId, eventType, and screen are required",
      });
    }

    // Validate event type
    const validEvents = ["view", "charging_start", "charging_end", "qr_scan"];
    if (!validEvents.includes(eventType)) {
      return reply.code(400).send({
        success: false,
        error:
          "Invalid event type. Allowed: view, charging_start, charging_end, qr_scan",
      });
    }

    // Find device and ad
    const device = await prisma.device.findUnique({
      where: { deviceId },
    });

    const ad = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!device || !ad) {
      return reply.code(404).send({
        success: false,
        error: "Device or ad not found",
      });
    }

    // Create stat record
    const stat = await prisma.stat.create({
      data: {
        deviceId: device.id,
        adId,
        eventType,
        screen,
        duration: duration ? parseInt(duration) : null,
        rotationSlot: rotationSlot ? parseInt(rotationSlot) : null,
      },
    });

    return reply.code(201).send({
      success: true,
      stat,
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      error: "Failed to record stat",
    });
  }
};

module.exports = { create };
