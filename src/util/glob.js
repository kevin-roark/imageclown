
const glb = require('glob')
const path = require('path')

const { srcDir } = require('../config')

const imgExts = new Set(['.jpg', '.png', '.tiff', '.gif'])
const videoExts = new Set(['.mp4', '.avi', '.webm', '.mkv'])
const typeFilters = {
  all: () => true,
  image: f => imgExts.has(path.extname(f)),
  video: f => videoExts.has(path.extname(f))
}

module.exports = function glob (pattern, { dir = srcDir, base = true, type = 'image' } = {}) {
  let files = glb.sync(`${dir}/${pattern}`)
  if (!base) {
    return files
  }

  let typeFilter = typeFilters[type] || typeFilters.all

  let basenames = files.filter(typeFilter).map(f => {
    let components = f.split('/')
    return components.slice(1).join(path.sep).replace(path.extname(f), '')
  })

  return basenames
}
