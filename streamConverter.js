const { spawn } = require('child_process');
const path = require('path');

function startStreaming(rtspUrl, outputPath) {
  const ffmpeg = spawn('ffmpeg', [
    '-i', rtspUrl,
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '3',
    '-hls_flags', 'delete_segments',
    path.join(outputPath, 'stream.m3u8')
  ]);

  ffmpeg.stderr.on('data', (data) => {
    console.log(`ffmpeg: ${data}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`ffmpeg process exited with code ${code}`);
  });

  return ffmpeg;
}

module.exports = { startStreaming };