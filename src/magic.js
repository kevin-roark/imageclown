
const { defaultFrameSize } = require('./config')

module.exports = {
  crop,
  append,
  gridAppend,
  resize,
  overlay,
  distort,
  compose,
  extraParams,
  color
}

function crop ({ width, height, x = 0, y = 0 }) {
  return `-crop ${width}x${height}+${x}+${y}`
}

function append (images, vertical = true) {
  return `xc:red ${images.join(' ')} ${vertical ? '-append' : '+append'} -crop +0+1`
}

function gridAppend (imageGrid) {
  return `${imageGrid.map(imageRow => `\\( ${imageRow.join(' ')} +append \\)`).join(' ')} -append`
}

function resize ({width, height}) {
  if (height && !width) {
    return `-resize x${height}`
  }
  else if (!height && width) {
    return `-resize ${width}`
  }
  else return `-resize ${width}x${height}`
}

// overlays should be an array of { image, geometry: { x, y, gravity }} objects
function overlay (baseImage, overlays) {
  let command = `${baseImage} `
  overlays.forEach(({ image, mask, compose, geometry = {} }) => {
    let { x = 0, y = 0, gravity = 'center' } = geometry
    let cmps = compose ? cmp(compose.name, compose.args) : ''
    command += `${image} ${mask ? mask : ''} -geometry +${x}+${y} -gravity ${gravity} ${cmps} -composite `
  })

  return command
}

function color (color, { width = defaultFrameSize.width, height = defaultFrameSize.height } = {}) {
  return `-size ${width}x${height} xc:${color}`
}

function distort (angle, zoom = 1) {
  return `-distort SRT '${zoom ? `${zoom}, ${angle}` : angle}'`
}

function compose (images, composeName, composeArgs) {
  let composeCmd = `${cmp(composeName, composeArgs)} -composite`
  return `${images[0]} ${images.slice(1).join(` ${composeCmd} `)} ${composeCmd}`
}

function cmp (composeName, composeArgs) {
  let c = `-compose ${composeName}`
  if (composeArgs !== undefined) {
    c += ` -define compose:args=${composeArgs}`
  }

  return c
}

function extraParams (options) {
  let {
    autoLevel,
    virtualPixel,
    blur,
    paint,
    emboss,
    sharpen,
    solarize,
    swirl,
    implode,
    fn
  } = options

  let params = []
  if (autoLevel) {
    params.push('-auto-level')
  }
  if (virtualPixel) {
    params.push(`-virtual-pixel ${virtualPixel}`)
  }
  if (blur) {
    params.push(`-blur 0x${blur}`)
  }
  if (paint) {
    params.push(`-paint ${paint}`)
  }
  if (emboss) {
    params.push(`-emboss ${emboss}`)
  }
  if (sharpen) {
    params.push(`-sharpen 0x${sharpen}`)
  }
  if (solarize) {
    params.push(`-solarize ${solarize}`)
  }
  if (swirl) {
    params.push(`-swirl ${swirl}`)
  }
  if (implode) {
    params.push(`-implode ${implode}`)
  }
  if (fn) {
    params.push(`-function ${fn}`)
  }

  return params.join(' ')
}
