
const path = require('path')

const { queue } = require('./exec')
const { futil, glob } = require('./util')
const { tempDir, ext } = require('./config')
const Frame = require('./frame')
const Chunk = require('./chunk')

const genMap = {}

module.exports = function videoChunk (video, { fps = 30, start = 0, duration } = {}) {
  let key = [video, fps, start].join('-')
  if (duration) key += `-${duration}`
  key = key.replace(/\//g, '-').replace(/\\/g, '-')

  if (genMap[key]) {
    return genMap[key]
  }

  let videofile = futil.sourcify(video, '.mp4')
  let dur = duration ? `-t ${duration}` : ''
  let cmd = `ffmpeg -ss ${start} ${dur} -i ${videofile} -vf fps=${fps} ${path.join(tempDir, `${key}-frame-%d${ext}`)}`
  queue.execSync(cmd)

  let images = glob(`${key}-frame-*`, { dir: tempDir, base: false })
  let firstFrame = new Frame({ src: images[0] })
  let { width, height } = firstFrame.getSize()
  let frames = images.map(src => new Frame({ src, width, height }))

  let chunk = new Chunk(frames)
  genMap[key] = chunk

  return chunk
}
