
const futil = require('./file-util')
const Frame = require('../frame')

module.exports = {
  arrify,
  framify,
  prefixify
}

function arrify (arr) {
  if (!arr) {
    return []
  }

  if (arr.getFrames) {
    return arr.getFrames()
  }

  if (!Array.isArray(arr)) {
    return [arr]
  }

  return arr
}

function framify (img) {
  return typeof(img) === 'string' ? new Frame({src: futil.sourcify(img)}) : img
}

function prefixify (arg) {
  return arg.replace(/ /g, '-')
}
