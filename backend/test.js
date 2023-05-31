const { createFFmpeg } = require("@ffmpeg/ffmpeg");
const fs = require("fs");
const { exit } = require("process");
const ffmpeg = createFFmpeg({ log: true });
(async () => {
  const webmFile = `3Kle56YD.webm`;
  const mp4File = `3Kle56YD.mp4`;
  const videoBlob = fs.readFileSync("./3Kle56YD.webm");
  await ffmpeg.load();
  ffmpeg.FS("writeFile", webmFile, videoBlob);

  // Convert the video to mp4 using FFmpeg
  await ffmpeg.run(
    "-i",
    webmFile,
    "-movflags",
    "faststart",
    "-preset",
    "ultrafast",
    "-crf",
    "40",
    "-vf",
    'scale=1280:-2',
    mp4File
  );

  // Get the mp4 blob data from the FFmpeg output
  const mp4Blob = ffmpeg.FS("readFile", mp4File);

console.log(mp4Blob.length)
  fs.writeFile(
    "test.mp4",
    Buffer.from(mp4Blob.buffer),
    () => console.log("video saved!"),
    exit(1)
  );
  return;
})();
