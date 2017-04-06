
const Chunk = require('../chunk')
const { arrify } = require('../util/ify')

module.exports = function distortion (chunk, { framesPerDistortion = 1, zoom = false, rotate = true } = {}) {
  let frames = arrify(chunk)
  let angle = 0
  let z = 1
  let distorted = frames.map((f, i) => {
    if (i % framesPerDistortion === 0) {
      if (rotate) {
        angle = Math.round(Math.random() * Math.random() * 360)
      }
      if (zoom) {
        z = 1 + Math.random() * Math.random() * 100
      }
    }

    return f.distort(angle, z)
  })

  return new Chunk(distorted)
}
