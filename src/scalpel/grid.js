
const magic = require('../magic')
const { futil } = require('../util')
const Frame = require('../frame')
const { arrify } = require('../util/ify')

module.exports = {
  grid,
  tile
}

// assumes that all frames of chunk are of equal size or else this is not gonna be a good time
function grid (chunk, { rows = 4, columns = 4 } = {}) {
  return _gridAppend(chunk, (f, rect) => f.cropped(rect), { rows, columns })
}

function tile (chunk, { rows = 8, columns = 8} = {}) {
  return _gridAppend(chunk, (f, rect) => f.cropResize(rect), { rows, columns })
}

function _gridAppend (chunk, framer, { rows, columns }) {
  let frames = arrify(chunk)
  let { width, height } = frames[0].getSize()
  let sectionWidth = Math.round(width / columns)
  let sectionHeight = Math.round(height / rows)

  let frameIndex = 0
  let gridFrames = []
  for (let row = 0; row < rows; row += 1) {
    let rowFrames = []
    for (let col = 0; col < columns; col += 1) {
      let f = frames[frameIndex]
      frameIndex = (frameIndex + 1) % frames.length

      let x = col * sectionWidth
      let y = row * sectionHeight
      let croppedFrame = framer(f, { x, y, width: sectionWidth, height: sectionHeight })
      rowFrames.push(croppedFrame)
    }
    gridFrames.push(rowFrames)
  }

  let gridImages = gridFrames.map(row => row.map(f => f.getImage()))

  let flatGridFrames = gridFrames.reduce((arr, row) => {row.forEach(f => arr.push(f)); return arr }, [])
  let flatGridImages = flatGridFrames.map(f => f.getImage())

  let outfile = futil.filehash(futil.mergeNames({ prefix: `grid_${rows}_${columns}`, filenames: flatGridImages }))
  let cmd = `convert ${magic.gridAppend(gridImages)} ${outfile}`

  return new Frame({ src: outfile, gen: cmd, dependents: flatGridFrames })
}
