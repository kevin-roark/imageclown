
const fs = require('fs-extra')
const path = require('path')

const { queue, newQueue } = require('./exec')
const { futil } = require('./util')
const { ext, overwriteVideoRender, crf } = require('./config')

module.exports = {
  preRender,
  render
}

function preRender () {
  makeCleanDir('img_temp')
}

// https://en.wikibooks.org/wiki/FFMPEG_An_Intermediate_Guide/image_sequence
function render (frames, options = {}) {
  let {
    ifps = 60, // number of input frames in a second (4 ifps means each frame is 0.25 seconds)
    ofps = 60, // the output fps of the video
    outdir = 'img_build', // where temporary images are stored
    videofile = 'vid.mp4' // final output name of video
  } = options

  let times = { start: new Date() }

  if (!overwriteVideoRender) {
    const rndm = futil.ghash(8)
    videofile = path.join('video_out', videofile.replace('.mp4', `_${rndm}.mp4`))
  }

  let largestFrameStr = frames.length + ''

  // delete current output directory and recreate blank slate
  console.log('removing old output...')
  makeCleanDir(outdir)
  checkDirSync('video_out')

  // copy filenames from master frames array to a ffmpeg-friendly list from 0 -> count
  process.stdout.write('generating images...\r')
  generateImages(frames)
  .then(() => {
    times.generate = new Date()
    logTime('generate images', times.start, times.generate)

    process.stdout.write('copying images to build...\r')
    return copyImages(frames)
  })
  .then(() => {
    times.copy = new Date()
    logTime('copy images', times.generate, times.copy)

    // run the ffmpeg command to create video
    console.log(`rendering video to ${videofile}...`)
    let command = [
      'ffmpeg',
      '-y',
      '-framerate', ifps.toFixed(3),
      '-i', `"${path.join(outdir, `%0${largestFrameStr.length}d${ext}`)}"`,
      '-r', ofps,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', crf, // change this to 18 for higher quality
      videofile
    ].join(' ')
    console.log('running ' + command)
    queue.execSync(command)

    times.ffmpeg = new Date()
    logTime('run ffmpeg', times.copy, times.ffmpeg)
  })

  function generateImages (frames) {
    let frameCount = frames.length
    let framesRendered = 0
    function logFrameRendered (res) {
      framesRendered += 1
      process.stdout.write(`rendered frame ${framesRendered} of ${frameCount}...\r`)
      return res
    }

    return Promise.all(frames.map(f => f.generate().then(logFrameRendered)))
  }

  function copyImages (frames) {
    let copyQueue = newQueue()

    return Promise.all(frames.map((frame, i) => {
      let filename = frame.getImage()

      // we have to pad output filename with 0s so that they are all of the same length
      let indexStr = i + ''
      while (indexStr.length < largestFrameStr.length) {
        indexStr = '0' + indexStr
      }

      let outname = path.join(outdir, indexStr + ext)

      let id = filename + '__' + outname
      let op = (resolve, reject) => {
        fs.copy(filename, outname, err => {
          if (err) return reject(err)
          return resolve(outname)
        })
      }

      return copyQueue.operation(op, { id })
    }))
  }
}

function logTime (name, time1, time2) {
  console.log(`time to ${name}: ${(Math.abs(time2 - time1) / 1000).toFixed(1) + 's'}`)
}

function makeCleanDir (dir) {
  fs.removeSync(dir)
  fs.mkdirSync(dir)
}

function checkDirSync (dir) {
  try {
    fs.statSync(dir)
  } catch(e) {
    fs.mkdirSync(dir)
  }
}
