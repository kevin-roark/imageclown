
const path = require('path')

const { identify } = require('./util')
const magic = require('./magic')
const { futil } = require('./util')
const ify = require('./util/ify')
const { newQueue } = require('./exec')
const { ext, defaultFrameSize } = require('./config')

const generationQueue = newQueue()
const sizeMap = {}

class Frame {
  constructor ({ src, width, height, gen, dependents } = {}) {
    this.src = src

    if (width && height) {
      this.width = width
      this.height = height

      if (!sizeMap[src]) {
        sizeMap[src] = { width, height }
      }
    }

    if (gen) {
      this.needsGeneration = true
      this.gen = gen
    }

    if (dependents) {
      this.dependents = dependents
      dependents.forEach(d => {
        if (d.needsGeneration) {
          this.needsGeneration = true
        }
      })
    }
  }

  copy (frame) {
    this.src = frame.src
    this.width = frame.width
    this.height = frame.height
    this.needsGeneration = frame.needsGeneration
    this.gen = frame.gen
    this.dependents = frame.dependents
    return this
  }

  clone () {
    return new Frame().copy(this)
  }

  getImage () {
    return this.src
  }

  getSize () {
    if (!this.width || !this.height) {
      this._setInfo()
    }

    return { width: this.width, height: this.height }
  }

  getWidth () {
    if (!this.width) {
      this._setInfo()
    }

    return this.width
  }

  getHeight () {
    if (!this.height) {
      this._setInfo()
    }

    return this.height
  }

  generate () {
    if (!this.needsGeneration) {
      return this
    }

    let deps = this.dependents || []
    return Promise.all(deps.map(d => d.generate()))
      .then(() => {
        return generationQueue.exec(this.gen)
      })
      .then(() => {
        this.needsGeneration = false
        return this
      })
  }

  cropResize ({ width = defaultFrameSize.width, height = defaultFrameSize.height } = {}) {
    let resize
    let output = futil.filehash(`${this._pureSrc()}_${width}_${height}_resize${ext}`)
    if (this.getWidth() / this.getHeight() > width / height) {
      resize = magic.resize({height})
    }
    else {
      resize = magic.resize({width})
    }

    let crop = magic.crop({ width, height })
    let cmd = this._convert(` ${resize} \ -gravity Center ${crop} \ ${output}`)

    return new Frame({ src: output, width, height, gen: cmd, dependents: [this] })
  }

  cropped ({ width, height, x, y }) {
    let output = futil.filehash(`${this._pureSrc()}_${width}_${height}_${x}_${y}${ext}`)
    let crop = magic.crop({ width, height, x, y })
    let cmd = this._convert(`${crop} ${output}`)

    return new Frame({ src: output, width, height, gen: cmd, dependents: [this] })
  }

  mask (frames, masks) {
    frames = ify.arrify(frames)
    masks = ify.arrify(masks)

    let overlays = frames.map((f, i) => ({
      image: f,
      mask: masks[i % masks.length]
    }))

    return this.overlay(overlays)
  }

  overlay (overlays) {
    if (!Array.isArray(overlays)) overlays = [overlays]

    // raw src support
    let frames = overlays.map(o => ify.framify(o.image))
    let masks = overlays.map(o => o.mask ? ify.framify(o.mask) : null)
    let cleanOverlays = overlays.map((overlay, idx) => ({
      image: frames[idx].getImage(),
      mask: masks[idx] ? masks[idx].getImage() : undefined,
      geometry: overlay.geometry,
      compose: overlay.compose
    }))

    let fname = `${this._pureSrc()}_overlay`
    cleanOverlays.forEach(({ image, geometry, compose, mask }) => {
      fname += `_${image}`
      if (geometry) {
        fname += `_${geometry.x || 0}_${geometry.y || 0}_${geometry.gravity || 'center'}`
      }
      if (compose) {
        fname += `_${compose.name}_${compose.args || 'none'}`
      }
      if (mask) {
        fname += `_mask${mask}`
      }
    })

    let output = futil.filehash(`${fname}${ext}`)
    let overlay = magic.overlay(this.src, cleanOverlays)
    let cmd = `convert ${overlay} ${output}`

    let dependents = [this].concat(frames).concat(masks.filter(m => !!m))
    return new Frame({ src: output, width: this.width, height: this.height, gen: cmd, dependents })
  }

  distort (angle, zoom) {
    let output = futil.filehash(`${this._pureSrc}_distort_${angle}_${zoom}_${ext}`)
    let cmd = `convert ${this.src} ${magic.distort(angle, zoom)} ${output}`

    return new Frame({ src: output, width: this.width, height: this.height, gen: cmd, dependents: [this] })
  }

  _setInfo () {
    let size = sizeMap[this.src]

    if (!size) {
      if (this.needsGeneration) {
        this.generate()
      }

      size = identify(this.src)
      sizeMap[this.src] = size
    }

    let { width, height } = size
    this.width = width
    this.height = height
  }

  _pureSrc () {
    return this.src.replace(path.extname(this.src), '')
  }

  _convert (cmd) {
    return `convert ${this.src} ${cmd}`
  }
}

module.exports = Frame
