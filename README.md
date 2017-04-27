# imageclown
Library to create image-sequence based videos in Node.js using a combination of Imagemagick and FFMPEG.

## Purpose

Linear video-editing software like Premiere is not super well-suited for making videos with precise
frame-by-frame arrangements. imageclown attempts to demonstrate a new way of making videos with code.

In a """nutshell""", you can import source images and videos as `frames`, create `chunks` of individual frames with provided `scalpel` and `patterns` methods, and render `chunks` into videos.

This library was used to make the music video for Perc's track ["Unelected"](https://www.youtube.com/watch?v=vmHr9dUhclo).

## Examples

Further documentation should come soon, but below are some example scripts. For now, you should just clone the repository
and add your code directly to the designated block in `main.js`. I still need to design the public api that will allow
you to simply run `imageclown ${script_name}` from the command line.

### Overlay
```js
let politics2Layers = new Chunk('politics2').repeat(8).map((f, idx) => {
  let p = `${75 - idx * 8}%`
  return f.cropResize({ width: p, height: p })
})

let politics1 = new Chunk('politics1').overlay(politics2Layers).crop().repeat(64)

let chunk = politics1.beatSpace('black', { interval: fpb / 2, imageLength: 2, chunkLength: 3 })

return chunk
```

### Waterfalling
```js
let black = mc(gen.color('black'))
let p5 = cc('image1')
let chunk1 = scalpel.waterfall(black, p5).repeat(fpb)

let colors = mc([gen.color('red')), gen.color('blue')])
let uk = cc(['ukpolitics1', 'ukpolitics2'])
let chunk2 = scalpel.waterfall(colors, uk, { vertical: false }).repeat(fpb)

let chunk = chunk1.add(chunk2).repeat(2)
return chunk
```

### Globbing and Blending
```js
let chunk1 = cc(glob('image*'))

let chunk = mc([
  scalpel.blendAverage(chunk1, 'divide'),
  scalpel.blend(chunk1, 'colorburn')
])
.multiply(2)
.repeat(fpb * 4)

return chunk
```

### Grid
```js
let chunk1 = cc([
  'image1',
  'image2',
  'image3',
])

let chunk = mc([
  scalpel.grid(chunk1),
  scalpel.grid(chunk1.shift(1)),
  scalpel.grid(chunk1.shift(2)),
  gen.color('black'),
  gen.color('black')
])
.multiply(3)
.repeat(8)

return chunk
```

### Video Chunk
```js
let gridvid = vc('video1')
let colors = cc([gen.color('black'), gen.color('red'), gen.color('blue')])
colors = scalpel.splice(colors, { divisions: 8 })

let chunk = gridvid.beatSpace(colors, { interval: fpb, chunkLength: 4 }).repeat(4)

return chunk
```

### Blend Waterfall
```js
let black = mc(gen.color('black'))

let chunk1 = scalpel.waterfall(black, cc('image1'), { cuts: 2 }).multiply(4).repeat(fpb)
let chunk2 = scalpel.waterfall(black, cc('image2'), { cuts: 3, vertical: false }).multiply(2).repeat(fpb)
let chunk3 = scalpel.waterfall(black, cc('image3'), { cuts: 4 }).multiply(7).repeat(fpb)
let chunk4 = scalpel.waterfall(black, cc('image4'), { cuts: 5, vertical: false }).multiply(3)

let chunk = chunk1.merge([chunk2, chunk3, chunk4], frames => scalpel.blend(frames, 'modulusadd'))

return chunk
```

### Tiling
```js
let black = mc(gen.color('black'))
let politics = cc(glob('images*'))
let tiles = mc([
  scalpel.tile(politics),
  scalpel.tile(politics.shift(1)),
  scalpel.tile(politics.shift(2)),
  scalpel.tile(politics.shift(3))
])
let chunk = black.intersperse(tiles).repeat(fpb * 4)

return chunk
```

### Masking with Patterns
```js
let p5 = cc('image1')
let w9 = cc('image2')

let vmask = mask.pattern({ pattern: 'vertical2' })
let hmask = mask.pattern({ pattern: 'horizontal2' })
let hexmask = mask.pattern({ pattern: 'hexagons', tile: true, maskWidth: 200 })
let sawmask = mask.pattern({ pattern: 'horizontalsaw', maskWidth: 100, tile: true })

let chunk = new Chunk([
  p5.maskInvert(w9, vmask),
  p5.maskInvert(w9, hexmask),
  p5.maskInvert(w9, hmask),
  p5.maskInvert(w9, sawmask)
])
.repeat(fpb * 2)

return chunk
```

### Diagonal Mask / Multimasking
```js
let politics = cc(['image1', 'image2', 'image3'])
let drone = cc('image4')
let masks = cc([mask.diagonal(45), mask.diagonal(-45)])

let chunk = scalpel.multimask(politics, drone, masks).repeat(fpb * 4)

return chunk
```

### Random / Plasma Masks
```js
let politics = cc(['image1', 'image2', 'image3'])
let drone = cc('image4')
let masks1 = [5, 10, 15, 20].map(i => mask.random({ blur: i, solarize: '50%' }))
let masks2 = patterns.range(1, 4).map(i => mask.random({ blur: 16, fn: `Sinusoid ${i},90` }))
let masks = patterns.intersperse([masks1, masks2])

let chunk = scalpel.multimask(politics, drone, masks).repeat(fpb * 2)

return chunk
```

### Random Cuts
```js
let trump = cc('image1')
let drone = cc('image2')

let chunk = scalpel.randomCuts(drone, trump)
  .add(scalpel.randomCuts(drone, trump, { build: true, cutsPerFrame: 2 }))
  .multiply(2)
  .repeat(4)

return chunk
```
