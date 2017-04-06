
let path = require('path')
let fs = require('fs-extra')

const { srcDir, tempDir, inputExt, ext: outputExt } = require('../config')

module.exports = {
  sourcify,
  ghash,
  filehash,
  mergeNames,
  purebase,
  doesOutfileExist
}

function sourcify (src, ext = inputExt ) {
  const f = i => src.indexOf('.') < 0 ? path.join(srcDir, i + ext) : src

  return Array.isArray(src) ? src.map(f) : f(src)
}

let chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
function ghash (length = 8) {
  let h = ''
  while (h.length < length) {
    h += chars[Math.floor(Math.random() * chars.length)]
  }
  return h
}

function ghashFilename (fullFilename) {
  return path.join(tempDir, ghash() + path.extname(fullFilename))
}

const filehashMap = {}
function filehash (fullFilename) {
  let hash = filehashMap[fullFilename]
  if (hash) {
    return hash
  }

  hash = ghashFilename(fullFilename)
  filehashMap[fullFilename] = hash

  return hash
}

function mergeNames ({ prefix, filenames, ext = outputExt }) {
  let name = prefix

  filenames.forEach(el => {
    name = `${name}__${purebase(el)}`
  })

  return path.join(tempDir, `${name}${ext}`)
}

function purebase (filename) {
  return path.basename(filename, path.extname(filename), '')
}

function doesOutfileExist (command) {
  const components = command.split(' ')
  const outfile = components[components.length - 1]
  return fs.existsSync(outfile)
}
