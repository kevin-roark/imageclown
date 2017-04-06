
module.exports = function randomWeights (count, { max = 0.5, min = 0.05 } = {}) {
  let weights = []
  let sum = 0
  for (let i = 0; i < count - 1; i++) {
    let mx = Math.min(max, 1 - sum)
    let mn = Math.min(1 - sum, min)
    let w = Math.floor(1000 * (mn + Math.random() * (mx - mn))) / 1000
    sum += w
    weights.push(w)
  }
  weights.push(1 - sum)
  return weights
}
