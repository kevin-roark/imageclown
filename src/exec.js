
const { exec, execSync } = require('child_process')
const { parallelCmds } = require('./config')
const { ghash } = require('./util/file-util')

class ExecutionQueue {
  constructor ({ parallel = parallelCmds, retries = 3, log = false } = {}) {
    this.parallel = parallel
    this.retries = retries
    this.log = log

    this.q = []
    this.queuedIds = {}
    this.queueResolves = {}
    this.runResolves = {}
    this.idResponses = {}
    this.running = 0
  }

  convert (command, outfile, priority) {
    let cmd = `convert ${command} ${outfile}`
    return this.exec(cmd, priority)
  }

  exec (cmd, priority) {
    let op = (resolve, reject) => {
      exec(cmd, err => {
        if (err) return reject(err)

        return resolve()
      })
    }

    let components = cmd.split(' ')
    let outfile = components[components.length - 1]

    return this.operation(op, { priority, id: outfile, cmd })
  }

  operation (op, { priority = 0, id = ghash(8) } = {}) {
    if (this.idResponses[id]) {
      this._log(['easy', id])
      return this.idResponses[id].res
    }

    if (this.queuedIds[id] || this.queueResolves[id]) {
      this._log(['collision', id])
      return this._idCollision(id)
    }

    if (this.running >= this.parallel) {
      this._log(['queue', this.running, this.parallel, this.q.length])
      return this._addToQueue(op, priority, id)
    }

    return this._run(op, id)
  }

  execSync (cmd) {
    return execSync(cmd)
  }

  _log (args) {
    if (this.log) {
      console.log(args.join(' '))
    }
  }

  _run (op, id, retry = 0) {
    if (!retry) {
      this.running += 1
      this._log(['running', this.running, id, this.q.length])
    }

    return new Promise(op)
      .then(res => {
        this.running -= 1
        this.idResponses[id] = { res }

        let runResolves = this.runResolves[id]
        if (runResolves) {
          runResolves.forEach(resolve => resolve(res))
          delete this.runResolves[id]
        }

        setTimeout(() => {
          this._checkQueue()
        }, 0)

        return res
      })
      .catch(err => {
        if (retry < this.retries) {
          return new Promise(resolve => setTimeout(resolve, 100))
          .then(() => this._run(op, id, retry + 1))
        } else {
          console.log('FAILED TO RUN:::', id)
          throw err
        }
      })
  }

  _addToQueue (op, priority, id) {
    let { q, queueResolves, queuedIds } = this

    let el = { op, priority, id }
    let idx = indexOf(el, q, queueComp)
    q.splice(idx + 1, 0, el)

    queuedIds[id] = true
    return new Promise(resolve => {
      queueResolves[id] = resolve
    })
    .then(() => {
      delete queuedIds[id]
      delete queueResolves[id]
      return this._run(op, id)
    })
  }

  _idCollision (id) {
    let { runResolves } = this
    return new Promise(resolve => {
      if (!runResolves[id]) {
        runResolves[id] = [resolve]
      } else {
        runResolves[id].push(resolve)
      }
    })
  }

  _checkQueue () {
    let { q, running, parallel, queueResolves } = this
    if (q.length === 0 || running >= parallel) {
      return
    }

    let el = q.shift()
    let resolve = queueResolves[el.id]
    setTimeout(() => resolve(), 0)

    return el
  }
}

module.exports = {
  queue: new ExecutionQueue(),
  newQueue: options => new ExecutionQueue(options)
}

function indexOf (el, arr, comp, start, end) {
  if (!arr || arr.length === 0) {
    return -1
  }

  start = start || 0
  end = end || arr.length
  if (!comp) comp = (a, b) => a - b

  var pivot = (start + end) >> 1

  var c = comp(el, arr[pivot])
  if (end - start <= 1) {
    return c == -1 ? pivot - 1 : pivot
  }

  switch (c) {
  case -1:
    return indexOf(el, arr, comp, start, pivot)
  case 0:
    return pivot
  case 1:
    return indexOf(el, arr, comp, pivot, end)
  }
}

function queueComp (a, b) {
  return b.priority - a.priority
}
