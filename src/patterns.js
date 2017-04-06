module.exports = {
  range,
  insert,
  insertEvery,
  remove,
  replace,
  add,
  join,
  repeat,
  repeatTo,
  multiply,
  multiplyTo,
  divide,
  split,
  iterSplit,
  separateBy,
  shuffle,
  choice,
  uchoice,
  space,
  pad,
  shift,
  merge,
  intersperse,
  getLengths
}

function range (p1, p2, delta = 1) {
  let min = 0
  let max = p1
  if (p2 !== undefined) {
    min = p1
    max = p2
  }

  let arr = []
  for (let i = min; i < max; i += delta) {
    arr.push(i)
  }
  return arr
}

function insert (arr, index, arr2) {
  if (!Array.isArray(arr2)) arr2 = [arr2]
  return arr.slice(0, index).concat(arr2).concat(arr.slice(index))
}

function insertEvery (arr, arr2, { every = 1, amount = 1 } = {}) {
  let processed = []
  let arr2i = 0
  for (let i = 0; i < arr.length; i++) {
    processed.push(arr[i])

    if (i !== arr.length - 1 && i % every === 0) {
      for (let j = 0; j < amount; j++) {
        processed.push(arr2[arr2i % arr2.length])
        arr2i += 1
      }
    }
  }

  return processed
}

function remove (arr, index, amount = 1) {
  return [].concat(arr).splice(index, amount)
}

function replace (arr, index, el) {
  let rarr = [].concat(arr)
  rarr[index] = el
  return rarr
}

function add (arr1, arr2) {
  return join([arr1, arr2])
}

function join (arrs) {
  let joined = []
  arrs.forEach(arr => (joined = joined.concat(arr)))
  return joined
}

function repeat (arr, times = 2, fn) {
  let repeated = []

  for (let i = 0; i < times; i++) {
    let processedArr = fn ? fn(arr) : arr
    repeated = repeated.concat(processedArr)
  }

  return repeated
}

function repeatTo (arr, length, fn) {
  let repeatTimes = Math.ceil(length / arr.length)
  return repeat(arr, repeatTimes, fn).slice(0, length)
}

function multiply (arr, times = 2) {
  let multiplied = []

  arr.forEach(item => {
    for (let i = 0; i < times; i++) {
      multiplied.push(item)
    }
  })

  return multiplied
}

function multiplyTo (arr, length) {
  let times = Math.ceil(length / arr.length)
  return multiply(arr, times).slice(0, length)
}

function divide (arr, times = 2) {
  let length = Math.floor(arr.length / times)
  return split(arr, length)
}

function split (arr, length = 2) {
  let parts = []

  let part = null
  arr.forEach((el, i) => {
    if (i % length === 0) {
      part = []
      parts.push(part)
    }

    part.push(el)
  })

  if (arr.length % length !== 0 && part && part.length > 0) {
    parts.push(part)
  }

  return parts
}

function iterSplit (arr, length = 2, iterate = 1) {
  let parts = []

  for (let i = 0; i < arr.length; i += (length - iterate)) {
    let part = arr.slice(i, i + length)
    parts.push(part)
  }

  return parts
}

// this lets you pass something like an array of colors, will make couples, quads, etc and insert
// iterating colors between frames
function separateBy (arr, seps, { length = 2, every = 1, amount = 1 } = {}) {
  let sepIdx = 0
  let separatedParts = split(arr, length).map(part => {
    let inserters = []
    for (let i = 0; i < length - 1; i++) {
      inserters[i] = seps[sepIdx % seps.length]
      sepIdx += 1
    }

    return insertEvery(part, inserters, { every, amount })
  })

  return join(separatedParts)
}

function shuffle (arr) {
  return [].concat(arr).sort(() => Math.random() - 0.5)
}

function uchoice (arr) {
  return choice(arr)[0]
}

function choice (arr, amount = 1) {
  let choices = []
  let chosenIndices = {}

  for (let i = 0; i < amount && i < arr.length; i++) {
    let idx = -1
    while (idx < 0 || chosenIndices[idx] === true) {
      idx = Math.floor(arr.length * Math.random())
    }
    chosenIndices[idx] = true

    choices.push(arr[idx])
  }

  return choices
}

function space (arr, spacer, { spaceLength = 1, chunkLength = 1 } = {}) {
  let spaceArr = Array.isArray(spacer) ? spacer : [spacer]
  let spaced = []

  let spaceArrIdx = 0
  arr.forEach((item, idx) => {
    if ((idx + 1) % chunkLength === 0) {
      spaced = spaced.concat(item, repeat(spaceArr[spaceArrIdx], spaceLength))
      spaceArrIdx = (spaceArrIdx + 1) % spaceArr.length
    }
    else {
      spaced.push(item)
    }
  })

  return spaced
}

function pad (arr, padding, times = 2) {
  let result = [].concat(arr)

  result.concat(repeat(padding, times))

  return result
}

function shift (arr, amount = 1) {
  return arr
    .slice(amount)
    .concat(arr.slice(0, amount))
}

const trimStyles = new Set(['short', 'long', 'none'])

// Takes an array of elements and applys fn to the 0th element of each arr, the 1st el, etc
function merge (arrs, fn, trimStyle = 'long') {
  if (!trimStyles.has(trimStyle)) {
    throw new Error(`Bad trimStyle: ${trimStyle}`)
  }

  let { minLength, maxLength } = getLengths(arrs)
  let limit = trimStyle === 'short' ? minLength : maxLength
  let isLong = trimStyle === 'long'

  let groups = []
  for (let i = 0; i < limit; i++) {
    let group = []
    arrs.forEach(arr => {
      if (i < arr.length) {
        group.push(arr[i])
      } else if (isLong) {
        group.push(arr[i % arr.length])
      }
    })

    groups.push(group)
  }

  return groups.map(fn)
}

// Makes array of [arr[0][0], arr[1][0], arr[0][1], ...]
function intersperse (arrs, trimStyle = 'none') {
  return [].concat.apply([], merge(arrs, group => group, trimStyle))
}

function getLengths (arrs) {
  let minLength = arrs.reduce((min, arr) => Math.min(arr.length, min), Infinity)
  let maxLength = arrs.reduce((max, arr) => Math.max(arr.length, max), 0)
  return { minLength, maxLength }
}
