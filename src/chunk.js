
const Frame = require('./frame')
const patterns = require('./patterns')
const { futil } = require('./util')
const config = require('./config')
const { arrify } = require('./util/ify')

const { fpb } = config

class Chunk {
  constructor (frames = []) {
    this.setFrames(frames)
  }

  setFrames (frames) {
    this.frames = toFrames(frames)
    return this
  }

  copy (chunk) {
    let frames = []
    for (let i = 0; i < chunk.frames.length; i++) frames.push(chunk.frames[i].clone())
    this.frames = frames
    return this
  }

  clone () {
    return new Chunk().copy(this)
  }

  cloneWithFrames (frames) {
    return new Chunk().copy(this).setFrames(frames)
  }

  getFrame (idx = 0) {
    return this.frames[idx % this.frames.length]
  }

  getFrames () {
    return this.frames
  }

  length () {
    return this.frames.length
  }

  map (fn) {
    let nc = this.clone()
    return nc.setFrames(nc.frames.map(fn))
  }

  filter (fn) {
    return this.cloneWithFrames(this.frames.filter(fn))
  }

  slice (start, end) {
    let nc = this.clone()
    return nc.setFrames(nc.frames.slice(start, end))
  }

  insert (index, chunk) {
    let nc = this.clone()
    return nc.setFrames(patterns.insert(nc.frames, index, chunkify(chunk).getFrames()))
  }

  insertEvery (chunk, options) {
    let nc = this.clone()
    return nc.setFrames(patterns.insertEvery(nc.frames, chunkify(chunk).getFrames(), options))
  }

  remove (index, amount = 1) {
    let nc = this.clone()
    return nc.setFrames(patterns.remove(nc.frames, index, amount))
  }

  merge (chunks, fn, trimStyle) {
    if (!Array.isArray(chunks)) chunks = [chunks]
    chunks = chunks.map(chunkify)

    let nc = this.clone()

    let allChunks = [nc].concat(chunks)
    let frames = allChunks.map(c => c.getFrames())
    return nc.setFrames(patterns.merge(frames, fn, trimStyle))
  }

  intersperse (chunks, trimStyle) {
    if (!Array.isArray(chunks)) chunks = [chunks]
    chunks = chunks.map(chunkify)

    let nc = this.clone()
    let allChunks = [nc].concat(chunks)
    let frames = allChunks.map(c => c.getFrames())
    return nc.setFrames(patterns.intersperse(frames, trimStyle))
  }

  intersperseLong (chunks) {
    return this.intersperse(chunks, 'long')
  }

  reverse () {
    let nc = this.clone()
    nc.frames.reverse()
    return nc
  }

  shuffle () {
    let nc = this.clone()
    return nc.setFrames(patterns.shuffle(nc.frames))
  }

  choice (amount = 1) {
    let nc = this.clone()
    return nc.setFrames(patterns.choice(nc.frames, amount))
  }

  shift (amount = 1) {
    let nc = this.clone()
    return nc.setFrames(patterns.shift(nc.frames, amount))
  }

  crop (cropOptions) {
    return this.map(f => f.cropResize(cropOptions))
  }

  mask (chunk, masks) {
    return this.overlay(chunk, { masks })
  }

  maskInvert (chunk, masks) {
    return this.mask(chunk, masks)
      .add(chunk.mask(this, masks))
  }

  overlay (chunk, { geometries, compose, masks } = {}) {
    let nc = this.clone()

    geometries = arrify(geometries)
    masks = arrify(masks)
    compose = arrify(compose)

    let images = chunk.getFrames()
    let overlays = images.map((image, idx) => ({
      image,
      geometry: geometries ? geometries[idx % geometries.length] : undefined,
      compose: compose ? compose[idx % compose.length] : undefined,
      mask: masks ? masks[idx % masks.length] : undefined
    }))

    return nc.setFrames(nc.frames.map(f => f.overlay(overlays)))
  }

  distort (angle, zoom) {
    return this.map(f => f.distort(angle, zoom))
  }

  add (chunk) {
    let nc = this.clone()
    return nc.setFrames(patterns.add(nc.frames, arrify(chunk)))
  }

  repeat (times = 2, fn) {
    let nc = this.clone()
    return nc.setFrames(patterns.repeat(nc.frames, times, fn))
  }

  repeatTo (length, fn) {
    let nc = this.clone()
    return nc.setFrames(patterns.repeatTo(nc.frames, length, fn))
  }

  multiply (times = 2) {
    let nc = this.clone()
    return nc.setFrames(patterns.multiply(nc.frames, times))
  }

  multiplyTo (length) {
    let nc = this.clone()
    return nc.setFrames(patterns.multiplyTo(nc.frames, length))
  }

  divide (times = 2) {
    return patterns.divide(this.frames, times).map(frames => this.cloneWithFrames(frames))
  }

  split (length = 2) {
    return patterns.split(this.frames, length).map(frames => this.cloneWithFrames(frames))
  }

  iterSplit (length, iterate) {
    return patterns.iterSplit(this.frames, length, iterate).map(frames => this.cloneWithFrames(frames))
  }

  splitMap (length, fn) {
    return new Chunk(this.split(length).map(fn))
  }

  iterSplitMap (length, iterate, fn) {
    return new Chunk(this.iterSplit(length, iterate).map(fn))
  }

  separateBy (separators, options) {
    let nc = this.clone()
    let seps = arrify(separators)
    return nc.setFrames(patterns.separateBy(nc.frames, seps, options))
  }

  space (spacer, options) {
    let nc = this.clone()
    let spaceFrames = spacer.getFrames ? spacer.getFrames() : spacer
    return nc.setFrames(patterns.space(nc.frames, spaceFrames, options))
  }

  pad (padding, times = 2) {
    let nc = this.clone()
    return nc.setFrames(patterns.pad(nc.frames, padding, times))
  }

  // length is in bars (i.e. 1 bar = 64 frames)
  beatRepeat (interval, length, pad) {
    let room = interval - this.frames.length

    if (room < 0) {
      let nc = this.clone()
      nc.setFrames(nc.frames.slice(interval))
      return nc.repeat(length)
    }
    else {
      return this
        .pad(pad, room)
        .repeat(length * (fpb / interval))
    }
  }

  beatSpace (spacer, { interval = fpb, imageLength = 1, chunkLength = 1 } = {}) {
    let mChunkLength = chunkLength * imageLength
    let spaceLength = interval - mChunkLength
    return this
      .multiply(imageLength)
      .space(spacer, { spaceLength, chunkLength: mChunkLength })
  }
}

module.exports = Chunk

function chunkify (c) {
  if (c.getFrames) {
    return c
  }

  return new Chunk(c)
}

function toFrames (frames) {
  if (!Array.isArray(frames)) frames = [frames]
  let _frames = []

  for (let i = 0; i < frames.length; i++) {
    let f = frames[i]
    if (typeof(f) === 'string') {
      _frames.push(new Frame({ src: futil.sourcify(f) }))
    } else if (f.getFrames) {
      _frames = _frames.concat(f.getFrames())
    } else if (Array.isArray(f)) {
      _frames = _frames.concat(toFrames(f))
    } else {
      _frames.push(f)
    }
  }

  return _frames
}
