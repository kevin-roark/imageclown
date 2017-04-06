
const magic = require('../magic')
const { futil } = require('../util')
const Frame = require('../frame')
const Chunk = require('../chunk')
const patterns = require('../patterns')
const { Easing } = require('../util')
const { arrify, prefixify } = require('../util/ify')
const { fpb } = require('../config')

module.exports = {
  blendAverage,
  evaluateSequence,

  blend,
  fadeIn,
  fadeOut,
  compose
}

const averageBlendModes = new Set(['mean', 'add', 'subtract', 'multiply', 'divide', 'max', 'min', 'median'])
function blendAverage (chunk, blendMode = 'add') {
  if (!averageBlendModes.has(blendMode.toLowerCase())) {
    throw new Error(`Bad blendMode provided: ${blendMode}`)
  }

  return evaluateSequence(chunk, blendMode)
}

function evaluateSequence (chunk, evaluateSequenceArg) {
  let frames = arrify(chunk)
  if (frames.length <= 1) {
    return frames.length === 0 ? null : frames[0]
  }

  let images = frames.map(f => f.getImage())
  let prefix = prefixify(evaluateSequenceArg)
  let outfile = futil.filehash(futil.mergeNames({ prefix, filenames: images }))

  let imageNames = images.join(' ')
  let cmd = `convert ${imageNames} -evaluate-sequence ${evaluateSequenceArg} ${outfile}`

  return new Frame({ src: outfile, gen: cmd, dependents: frames })
}

const blendModes = new Set([
  'blend',
  'overlay', 'hardlight', 'softlight', 'pegtoplight', 'linearlight', 'vividlight', 'pinlight',
  'lineardodge', 'linearburn', 'colordodge', 'colorburn',
  'multiply', 'screen', 'bumpmap', 'divide', 'plus', 'minus', 'modulusadd', 'modulussubtract', 'difference',
  'exclusion', 'lighten', 'darken', 'lightenintensity', 'darkenintensity'
])
function blend (chunk, blendMode = 'overlay', blendArgs) {
  if (!blendModes.has(blendMode.toLowerCase())) {
    throw new Error(`Bad blendMode provided: ${blendMode}`)
  }

  return compose(chunk, blendMode, blendArgs)
}

function fadeIn (backgroundChunk, overlayChunk, options) {
  return fade(backgroundChunk, overlayChunk, Object.assign({ fadeIn: true }, options))
}

function fadeOut (backgroundChunk, overlayChunk, options) {
  return fade(backgroundChunk, overlayChunk, Object.assign({ fadeIn: false }, options))
}

function fade (backgroundChunk, overlayChunk, options = {}) {
  let { frames = fpb, blendMode = 'blend', fadeIn = true, easing = Easing.Linear.None } = options
  let backgroundFrames = arrify(backgroundChunk)
  let overlayFrames = arrify(overlayChunk)

  let fadedFrames = patterns.range(frames).map(i => {
    let percent = easing(fadeIn ? (i / frames) : (1 - (i / frames))) * 100
    let backgroundFrame = backgroundFrames[i % backgroundFrames.length]
    let overlayFrame = overlayFrames[i % overlayFrames.length]
    return blend([backgroundFrame, overlayFrame], blendMode, percent)
  })

  let allFrames = backgroundFrames.length > frames ? fadedFrames.concat(backgroundFrames.slice(frames)) : fadedFrames
  return new Chunk(allFrames)
}

function compose (chunk, composeName, composeArgs) {
  let frames = arrify(chunk)
  if (frames.length <= 1) {
    return frames.length === 0 ? null : frames[0]
  }

  let images = frames.map(f => f.getImage())
  let prefix = composeArgs !== undefined ? prefixify(`${composeName}-${composeArgs}`) : prefixify(composeName)
  let outfile = futil.filehash(futil.mergeNames({ prefix, filenames: images }))

  let cmd = `convert ${magic.compose(images, composeName, composeArgs)} ${outfile}`

  return new Frame({ src: outfile, gen: cmd, dependents: frames })
}
