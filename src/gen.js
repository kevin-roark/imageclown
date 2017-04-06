const { futil } = require('./util')
const Frame = require('./frame')
const magic = require('./magic')
const { ext, defaultFrameSize } = require('./config')

module.exports = {
  color
}

// List of Color Names: https://www.imagemagick.org/script/color.php#color_names

function color (color, options = {}) {
  let colorCmd = magic.color(color, options)
  let outfile = futil.filehash(`${color}${ext}`)
  let cmd = `convert ${colorCmd} ${outfile}`

  let { width = defaultFrameSize.width, height = defaultFrameSize.height } = options
  return new Frame({ src: outfile, gen: cmd, width, height })
}
