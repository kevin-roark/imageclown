
const Chunk = require('../chunk')

module.exports = function waterfall (bgChunk, cutChunk, options = {}) {
  let { vertical = true, reverse = false, cuts = 8, framesPerCut = 1, cutWeights, compose } = options

  let x = 0, y = 0
  let { width: fwidth, height: fheight } = cutChunk.getFrame(0).getSize()
  if (reverse) {
    if (vertical) y = fheight
    else x = fwidth
  }

  let frames = []
  for (let i = 0; i < cuts; i++) {
    let cutChunkFrame = cutChunk.getFrame(i)
    let weight = cutWeights ? cutWeights[i] : (1 / cuts)
    let width = !vertical ? Math.floor(fwidth * weight) : fwidth
    let height = vertical ? Math.floor(fheight * weight) : fheight

    let overlay = {
      image: cutChunkFrame.cropped({ x, y, width, height }),
      geometry: { x, y, gravity: 'NorthWest' },
      compose
    }

    for (let j = 0; j < framesPerCut; j++) {
      let bgFrame = bgChunk.getFrame(i * framesPerCut + j)
      let frame = bgFrame.overlay(overlay)
      frames.push(frame)
    }

    if (vertical) {
      y += reverse ? -height : height
    } else {
      x += reverse ? -width : width
    }
  }

  return new Chunk(frames)
}
