
const { queue } = require('../exec')

module.exports = function identify (imgPath) {
  let output = queue.execSync(`identify ${imgPath}`).toString().split(' ')
  let [width, height] = output[2].split('x')
  let fileSize = output[6]

  return {
    width: parseFloat(width),
    height: parseFloat(height),
    fileSize
  }
}
