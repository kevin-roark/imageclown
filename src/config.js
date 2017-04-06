
const bpm = 128
const fpb = 32 // frames per beat
const fps = 60
const ifps = fpb * (bpm / 60)

// Testing with 0:00 - 1:00 sequence on my quad core macbook pro
// sync - 89.3s to generate and copy images
// 2 commands - 31.1s to generate images,
// 4 commands - 24.5s to generate images, 2.6s to copy images
// 6 commands - 21.7s to generate images, 2.0s to copy images
// 8 commands - 21.1s to generate images, 1.8s to copy images
// 16 commands - 22.1s to generate images, 1.6s to copy images
const parallelCmds = 4

module.exports = {
  bpm, fpb, fps, ifps, parallelCmds,
  srcDir: 'img',
  tempDir: 'img_temp',
  overwriteVideoRender: false,
  crf: 18,
  ext: '.jpg',
  inputExt: '.jpg',
  defaultFrameSize: { width: 1920, height: 1080 }
}
