const prisma = require("../config/database");
const { uploadToB2, deleteFromB2 } = require("../services/storageService");
const { compressVideo } = require("../utils/videoProcessor");
const path = require("path");
const fs = require("fs").promises;
const { pipeline } = require("stream/promises");

const adController = {
  // POST /api/ads/upload
  upload: async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({
          success: false,
          error: "No file uploaded",
        });
      }

      const { filename, mimetype } = data;
      const { name, duration, clientName, type } = data.fields;

      // Validate file type
      const allowedTypes = [
        "video/mp4",
        "video/quicktime",
        "image/jpeg",
        "image/png",
      ];
      if (!allowedTypes.includes(mimetype)) {
        return reply.code(400).send({
          success: false,
          error: "Invalid file type. Allowed: MP4, MOV, JPG, PNG",
        });
      }

      // Save temporarily
      const tempPath = path.join(
        process.env.UPLOAD_DIR || "./uploads",
        `temp_${Date.now()}_${filename}`
      );
      await pipeline(data.file, require("fs").createWriteStream(tempPath));

      let finalPath = tempPath;
      let fileSize = (await fs.stat(tempPath)).size;

      // Compress video if needed
      if (mimetype.startsWith("video/")) {
        try {
          const compressedPath = await compressVideo(tempPath);
          // Delete original
          await fs.unlink(tempPath);
          finalPath = compressedPath;
          fileSize = (await fs.stat(finalPath)).size;
        } catch (error) {
          request.log.error("Video compression failed:", error);
          // Continue with original if compression fails
        }
      }

      // Upload to B2
      const b2Url = await uploadToB2(finalPath, filename);

      // Delete local file
      await fs.unlink(finalPath);

      // Save to database
      const ad = await prisma.ad.create({
        data: {
          name: name || filename,
          type: type || (mimetype.startsWith("video/") ? "video" : "image"),
          url: b2Url,
          duration: parseInt(duration) || 30,
          clientName: clientName || null,
          fileSize,
        },
      });

      return reply.code(201).send({
        success: true,
        ad,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to upload ad",
      });
    }
  },

  // GET /api/ads
  getAll: async (request, reply) => {
    try {
      const ads = await prisma.ad.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { deviceAds: true, stats: true },
          },
        },
      });

      return reply.send({
        success: true,
        ads,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch ads",
      });
    }
  },

  // GET /api/ads/:id
  getById: async (request, reply) => {
    try {
      const { id } = request.params;

      const ad = await prisma.ad.findUnique({
        where: { id },
        include: {
          deviceAds: {
            include: { device: true },
          },
          _count: {
            select: { stats: true },
          },
        },
      });

      if (!ad) {
        return reply.code(404).send({
          success: false,
          error: "Ad not found",
        });
      }

      return reply.send({
        success: true,
        ad,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch ad",
      });
    }
  },

  // PUT /api/ads/:id
  updateAd: async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, duration, clientName } = request.body;

      const ad = await prisma.ad.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(duration && { duration: parseInt(duration) }),
          ...(clientName && { clientName }),
        },
      });

      return reply.send({
        success: true,
        ad,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update ad",
      });
    }
  },

  // DELETE /api/ads/:id
  deleteAd: async (request, reply) => {
    try {
      const { id } = request.params;

      const ad = await prisma.ad.findUnique({ where: { id } });
      if (!ad) {
        return reply.code(404).send({
          success: false,
          error: "Ad not found",
        });
      }

      // Delete from B2
      await deleteFromB2(ad.url);

      // Delete from database (cascade will delete deviceAds and stats)
      await prisma.ad.delete({ where: { id } });

      return reply.send({
        success: true,
        message: "Ad deleted successfully",
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete ad",
      });
    }
  },
};

module.exports = adController;
