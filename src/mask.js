
const { futil } = require('./util')
const Frame = require('./frame')
const magic = require('./magic')
const { ext, defaultFrameSize } = require('./config')

module.exports = {
  diagonal,
  pattern,

  plasma,
  random
}

function diagonal (angle, options) {
  let ops = Object.assign({ rotate: angle, pattern: 'vertical2', zoom: 1.2 }, options)
  return pattern(ops)
}

// List of patterns available here: http://www.imagemagick.org/script/formats.php#builtin-patterns
// Highlights include horizontal[2,3], vertical[2,3], hexagons, bricks, crosshatch[30, 45], gray[0 - 100 by 5],
// verticalsaw, horizontalsaw
function pattern (options = {}) {
  let {
    pattern = 'vertical2',
    width = defaultFrameSize.width,
    height = defaultFrameSize.height,
    maskWidth = 25,
    tile = false,
    rotate = false,
    zoom = false
  } = options

  let size = `${maskWidth}x${Math.ceil(height / width * maskWidth)}`
  let scale = ((width / maskWidth) * 100) + '%'

  let params = [pattern, width, height, maskWidth, `tile-${tile}`, `rotate-${rotate}`, `zoom-${zoom}`]
  let outfile = futil.filehash(`mask_${params.join('_')}${ext}`)

  let patternCmd = `${tile? 'tile:' : ''}pattern:${pattern}`
  let distort = rotate ? magic.distort(rotate, zoom) : ''
  let cmd = `convert -size ${size} ${patternCmd} -scale ${scale} ${distort} ${outfile}`

  return new Frame({ src: outfile, gen: cmd, width, height })
}

// Some nice plasma options are fractal, grey50-grey50, tomato, red-blue, grey20-grey80
function plasma (options = {}) {
  let { plasma = '', width = defaultFrameSize.width, height = defaultFrameSize.height } = options

  let extraParams = magic.extraParams(Object.assign({ autoLevel: true }, options))
  let params = [plasma, width, height].concat([extraParams.replace(/ /g, '_')])
  let outfile = futil.filehash(`plasma_${futil.ghash()}_${params.join('_')}${ext}`)

  let size = `${width}x${height}`
  let cmd = `convert -size ${size} plasma:${plasma} ${extraParams} -monochrome ${outfile}`

  return new Frame({ src: outfile, gen: cmd, width, height })
}

// blur is important
// solarize: 50% makes weird blobs
// fn: 'Sinusoid '3,90' is cool
function random (options = {}) {
  let { width = defaultFrameSize.width, height = defaultFrameSize.height } = options

  let extraParams = magic.extraParams(Object.assign({ virtualPixel: 'tile', autoLevel: true }, options))
  let params = [width, height].concat([extraParams.replace(/ /g, '_')])
  let outfile = futil.filehash(`random_${params.join('_')}${ext}`)

  let size = `${width}x${height}`
  let cmd = `convert -size ${size} xc: -channel G +noise random ${extraParams} -separate +channel -monochrome ${outfile}`

  return new Frame({ src: outfile, gen: cmd, width, height })
}
