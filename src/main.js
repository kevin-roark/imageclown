#! /usr/local/bin/node

let config = require('./config')
let scalpel = require('./scalpel') // eslint-disable-line
let renderer = require('./renderer')
let Chunk = require('./chunk')
let videoChunk = require('./video-chunk') // eslint-disable-line
let mask = require('./mask') // eslint-disable-line
let patterns = require('./patterns') // eslint-disable-line
let gen = require('./gen') // eslint-disable-line
const { Easing, glob } = require('./util') // eslint-disable-line
let { join: pj } = require('path') // eslint-disable-line

const { fpb, ifps, fps } = config // eslint-disable-line
const fpbar = fpb * 4 // eslint-disable-line
const mc = arr => new Chunk(arr) // eslint-disable-line
const cc = arr => mc(arr).crop() // eslint-disable-line
const vc = (vid, ops) => videoChunk(pj('vids', vid), ops).crop() // eslint-disable-line
const mcr = (n, fn) => mc(patterns.range(n).map(fn)) // eslint-disable-line

renderer.preRender()

console.log('producing chunk...')
let chunk = getMainChunk()

renderer.render(chunk.frames, { ifps, ofps: fps })


/**
 * Here we write the pattern to get a chunk.
 * We can save the code patterns for the chunks we like in the readme.
 */
function getMainChunk () {
  let black = cc(gen.color('black'))
  let crimson = cc(gen.color('crimson'))
  let royal = cc(gen.color('MediumBlue'))

  let faces = cc([
    'nuttal2', 'nick', 'milo', 'milliband2', 'may1', 'kahn2', 'hunt2', 'hammond2', 'griffin2', 'griffin1', 'gauck1',
    'farage1', 'farage2', 'corbyn1', 'charles1', 'cameron1', 'cameron3', 'boris1', 'blair', 'balls1', 'adams2',
    'sturgeon2', 'sturgeon1', 'smith1', 'smith2',
    'ukip_thumb'
  ])
  .repeat(32, patterns.shuffle)

  let cloak = cc('people1')

  let flashingFaces = faces.multiply(2)
  .insertEvery([black, black, crimson, black, black, royal], { every: 3 })
  .slice(0, fpbar * 8)

  let cloakedFaces = scalpel.fadeOut(flashingFaces, cloak, { frames: fpbar, easing: Easing.Cubic.In })

  return cloakedFaces
}
