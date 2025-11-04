const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

const videoProcessor = {
  compressVideo: (inputPath) => {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(
        path.dirname(inputPath),
        `compressed_${Date.now()}_${path.basename(inputPath)}`
      );

      ffmpeg(inputPath)
        .videoCodec("libx264")
        .videoBitrate(process.env.VIDEO_BITRATE || "800k")
        .size(process.env.VIDEO_RESOLUTION || "800x1280")
        .audioCodec("aac")
        .audioBitrate(process.env.AUDIO_BITRATE || "96k")
        .outputOptions([
          "-movflags +faststart", // Optimize for streaming
          "-preset medium",
        ])
        .output(outputPath)
        .on("start", (commandLine) => {
          console.log("FFmpeg command:", commandLine);
        })
        .on("progress", (progress) => {
          console.log(`Processing: ${progress.percent}% done`);
        })
        .on("end", () => {
          console.log("Video compression completed");
          resolve(outputPath);
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          reject(err);
        })
        .run();
    });
  },
};

module.exports = videoProcessor;
