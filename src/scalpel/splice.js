
const magic = require('../magic')
const { futil } = require('../util')
const Frame = require('../frame')
const { arrify } = require('../util/ify')

module.exports = function splice (chunk, options = {}) {
  let frames = arrify(chunk)

  let {
    weights = frames.map(() => 1 / frames.length), // percentage of the output frame that each input frame occupies (must sum to 1)
    vertical = true, // whether to splice vertically or horizontally
    divisions = frames.length
  } = options

  let croppedFrames = []
  let offset = 0
  for (let i = 0; i < divisions; i++) {
    let f = frames[i % frames.length]
    let weight = weights[i % weights.length] * (frames.length / divisions)
    let cf = f.cropped({
      width: vertical ? '100%' : `${weight * 100}%`,
      height: vertical ? `${weight * 100}%` : '100%',
      x: vertical ? 0 : Math.round(offset * f.getWidth()),
      y: vertical ? Math.round(offset * f.getHeight()) : 0
    })
    croppedFrames.push(cf)

    offset += weight
  }
  let croppedImages = croppedFrames.map(f => f.getImage())

  let prefix = `splice_${vertical ? 'v' : 'h'}_${weights.join('-')}_div-${divisions}`
  let outfile = futil.filehash(futil.mergeNames({ prefix, filenames: croppedImages }))
  let append = magic.append(croppedImages, vertical)
  let cmd = `convert ${append} ${outfile}`

  return new Frame({ src: outfile, gen: cmd, dependents: croppedFrames })
}
