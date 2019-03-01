'use strict'

const sym =
  typeof Symbol === 'function'
    ? Symbol
    : /* istanbul ignore next */ x => '$teme$_' + x

const kValue = sym('value')
const kNotify = sym('notify')
const kDetacher = sym('detacher')

// The main entry point for source streams (as opposed to derived ones)
//
// A stream is a function (acting as a get/setter), but inheriting
// prototypically from Stream
//
export default function Stream (v) {
  const s = createStream(v)
  addEndStream(s)
  return s
}

// Constructs a stream function, setting its own proerties and prototype
function createStream (value) {
  function stream () {
    if (arguments.length !== 0) {
      const value = arguments[0]
      stream[kValue] = value
      // the list of notifies is created as a separate array, as some
      // of the notify callbacks will update/delete the notify list as
      // we are traversing it
      const notifies = Array.from(stream[kNotify])
      notifies.forEach(f => f(value))
    }
    return stream[kValue]
  }

  Object.defineProperties(stream, {
    [kValue]: { value, configurable: true, writable: true },
    [kNotify]: { value: new Set(), configurable: true, writable: true },
    [kDetacher]: { value: new Set(), configurable: true, writable: true }
  })
  Object.setPrototypeOf(stream, Stream.prototype)
  return stream
}

// adds a '.end' stream to a stream, setting up the notifies
function addEndStream (s) {
  s.end = createStream()
  s.end.subscribe(() => {
    endStream(s.end)
    endStream(s)
  })
}

function endStream (s) {
  s[kNotify].clear()
  Array.from(s[kDetacher]).forEach(f => f())
  s[kDetacher].clear()
}

// The workhorse for all derived streams
//
Stream.combine = function combine (fn, streams, opts = {}) {
  const derived = createStream()
  addEndStream(derived)

  function recalcDerived (changed) {
    const ret = fn(...[...streams, derived, changed])
    if (ret != null) derived(ret)
  }

  if (opts.skip) {
    derived(opts.initial)
  } else {
    recalcDerived(streams)
  }

  streams.forEach(stream => {
    // if the upstream updates, then we re-derive
    derived[kDetacher].add(stream.subscribe(() => recalcDerived([stream])))
    // if the upstream ends, then so do we
    derived.end[kDetacher].add(stream.end.subscribe(x => derived.end(x)))
  })
  return derived
}

// common methods for all streams
Stream.prototype = {
  subscribe (fn) {
    this[kNotify].add(fn)
    return () => this[kNotify].delete(fn)
  },

  map (fn, opts) {
    return Stream.combine(s => fn(s()), [this], opts)
  },

  clone () {
    return this.map(x => x)
  },

  merge (...streams) {
    return Stream.merge(...[this, ...streams])
  },

  scan (fn, accum) {
    return this.map(
      value => {
        accum = fn(accum, value)
        return accum
      },
      { skip: true, initial: accum }
    )
  },

  dedupe (cmp, opts) {
    if (cmp && typeof cmp === 'object') {
      opts = cmp
      cmp = undefined
    }
    cmp = cmp || identical
    opts = opts || {}
    let prev
    if (!opts.skip) prev = this()
    return Stream.combine(
      (source, target) => {
        const val = source()
        if (!cmp(prev, val)) target(val)
        prev = val
      },
      [this],
      { skip: true, initial: prev }
    )
  },

  when (fn) {
    let resolver
    let isResolved
    const freshPromise = () =>
      new Promise(resolve => {
        resolver = resolve
      })
    const initialPromise = freshPromise()
    if (fn(this())) {
      isResolved = true
      resolver()
    }

    return this.scan((prom, value) => {
      if (fn(value)) {
        if (!isResolved) {
          isResolved = true
          resolver()
        }
      } else {
        if (isResolved) {
          isResolved = false
          prom = freshPromise()
        }
      }
      return prom
    }, initialPromise)
  },

  changed () {
    return new Promise(resolve => {
      const unsub = this.subscribe(x => {
        resolve(x)
        unsub()
      })
    })
  },

  throttle (period) {
    let timeout
    let callDue
    const update = () => {
      derived(this())
      callDue = false
    }
    const startTimer = () =>
      setTimeout(() => {
        if (callDue) {
          update()
          timeout = startTimer()
        } else {
          timeout = null
        }
      }, period)
    const derived = Stream.combine(
      () => {
        if (timeout) {
          callDue = true
        } else {
          update() // leading edge
          timeout = startTimer()
        }
      },
      [this],
      { skip: true }
    )
    return derived
  },

  debounce (period) {
    let timeout
    const update = () => {
      derived(this())
      timeout = null
    }
    const startTimer = () => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(update, period)
    }
    const derived = Stream.combine(startTimer, [this], { skip: true })
    return derived
  }
}

Stream.merge = function merge (...streams) {
  return Stream.combine(
    (...args) => {
      const changed = args.pop()
      const self = args.pop()
      changed.forEach(s => self(s()))
    },
    streams,
    { skip: true }
  )
}

Stream.fromPromise = function fromPromise (p) {
  const s = Stream()
  p.then(
    result => {
      s(result)
      s.end(true)
    },
    reason => {
      if (!(reason instanceof Error)) {
        const err = new Error('Rejected promise')
        err.promise = p
        err.reason = reason
        reason = err
      }
      s(reason)
      s.end(true)
    }
  )
  return s
}

Object.setPrototypeOf(Stream.prototype, Function.prototype)

function identical (a, b) {
  return a === b
}
