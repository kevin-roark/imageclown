
const blending = require('./blending')
const distortion = require('./distortion')
const grid = require('./grid')
const multimask = require('./multimask')
const randomCuts = require('./random-cuts')
const splice = require('./splice')
const waterfall = require('./waterfall')

module.exports = Object.assign({
  distortion, randomCuts, splice, waterfall
}, blending, grid, multimask)
