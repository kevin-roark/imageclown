
const mask = require('./mask')
const Chunk = require('../chunk')
const patterns = require('../patterns')
const { arrify } = require('../util/ify')

module.exports = {
  multimask,
  wheel
}

function multimask (chunk1, chunk2, masks, trimStyle) {
  let chunks = [chunk1, chunk2, masks]
  let frameArrs = chunks.map(arrify)

  let frames = patterns.merge(frameArrs, ([c1Frame, c2Frame, mask]) => c1Frame.mask(c2Frame, mask), trimStyle)

  return new Chunk(frames)
}

function wheel (chunk1, chunk2, { rotations = 16, framesPerRotation = 1, clockwise = true, trimStyle, options } = {}) {
  let masks = []
  for (let i = 0; i < rotations; i++) {
    let angle = (i / rotations) * 360 * (clockwise ? -1 : 1)
    let diag = mask.diagonal(angle, options)
    for (let j = 0; j < framesPerRotation; j++) {
      masks.push(diag)
    }
  }

  return multimask(chunk1, chunk2, masks, trimStyle)
}
