const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const b2Client = require("../config/storage");
const fs = require("fs");
const path = require("path");

const storageService = {
  // Upload file to B2
  uploadToB2: async (filePath, fileName) => {
    try {
      const fileStream = fs.createReadStream(filePath);
      const bucketName = process.env.B2_BUCKET_NAME;
      const key = `videos/${Date.now()}_${fileName}`;

      const upload = new Upload({
        client: b2Client,
        params: {
          Bucket: bucketName,
          Key: key,
          Body: fileStream,
          ContentType: "video/mp4",
        },
      });

      await upload.done();

      // Return public URL (via Cloudflare CDN if configured)
      const b2Url = `${process.env.B2_ENDPOINT}/${bucketName}/${key}`;
      return b2Url;
    } catch (error) {
      console.error("B2 upload error:", error);
      throw new Error("Failed to upload to B2");
    }
  },

  // Delete file from B2
  deleteFromB2: async (fileUrl) => {
    try {
      // Extract key from URL
      const urlParts = fileUrl.split("/");
      const key = urlParts.slice(-2).join("/"); // e.g., "videos/123456_file.mp4"

      const command = new DeleteObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: key,
      });

      await b2Client.send(command);
      return true;
    } catch (error) {
      console.error("B2 delete error:", error);
      throw new Error("Failed to delete from B2");
    }
  },
};

module.exports = storageService;
