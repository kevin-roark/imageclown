
const Chunk = require('../chunk')
const patterns = require('../patterns')
const { arrify } = require('../util/ify')

// if multiple = true, will cut multiple images on top of the
// bg chunk at once. If false, will iterate over cutChunk cutting one image on top of bg at once
module.exports = function randomCuts (bgChunk, cutChunk, options = {}) {
  let { rows = 7, columns = 7, build = false, multiple = false, cutsPerFrame = 1, compose } = options

  let bgFrames = arrify(bgChunk)
  let cutFrames = arrify(cutChunk)

  if (multiple) {
    cutsPerFrame *= cutFrames.length
  }

  let getShuffledOverlays = frames => {
    let frameIndex = 0
    let overlays = []
    let _rows = typeof rows === 'function' ? rows() : rows
    let _cols = typeof columns === 'function' ? columns() : columns

    let width = Math.floor(frames[0].getWidth() / _cols)
    let height = Math.round(frames[0].getHeight() / _rows)

    for (let row = 0; row < _rows; row += 1) {
      for (let col = 0; col < _cols; col += 1) {
        let f = frames[frameIndex % frames.length]

        let x = col * width
        let y = row * height
        let croppedFrame = f.cropped({ x, y, width, height })
        let overlay = {
          image: croppedFrame,
          geometry: { x, y, gravity: 'NorthWest' },
          compose
        }

        overlays.push(overlay)
        frameIndex += 1
      }
    }

    return patterns.shuffle(overlays)
  }

  let consolidateOverlays = overlays => {
    if (cutsPerFrame <= 1) {
      return overlays.map(o => [o])
    }

    let consolidated = []
    for (let i = 0; i < overlays.length; i += cutsPerFrame) {
      let overlay = []
      for (let j = 0; j < cutsPerFrame && i + j < overlays.length; j++) {
        overlay.push(overlays[i + j])
      }
      consolidated.push(overlay)
    }
    return consolidated
  }

  let overlays
  if (multiple) {
    let frameOverlays = cutFrames.map(f => getShuffledOverlays([f]))
    overlays = patterns.intersperse(frameOverlays)
  } else {
    overlays = getShuffledOverlays(cutFrames)
  }

  overlays = consolidateOverlays(overlays)

  if (build) {
    for (let i = 1; i < overlays.length; i++) {
      overlays[i] = overlays[i - 1].concat(overlays[i])
    }
  }

  let frames = []
  for (let i = 0; i < overlays.length; i++) {
    let overlay = overlays[i]
    let bgFrame = bgFrames[i % bgFrames.length]

    let frame = bgFrame.overlay(overlay)
    frames.push(frame)
  }

  return new Chunk(frames)
}
