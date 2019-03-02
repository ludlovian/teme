'use strict'

const sym =
  typeof Symbol === 'function'
    ? Symbol
    : /* istanbul ignore next */ x => '$teme$_' + x

const kValue = sym('value')
const kParents = sym('parents')
const kChildren = sym('children')
const kFunction = sym('function')
function NOOP () {}

// The main entry point for source streams (as opposed to derived ones)
//
// A stream is a function (acting as a get/setter), but inheriting
// prototypically from Stream
//
export default function Stream (v) {
  const s = createStream(v)
  s.end = createStream(false)
  // special link between stream and its `.end`
  s.end[kChildren].add(s)
  return s
}

// Constructs a stream function, setting its own proerties and prototype
function createStream (value) {
  function stream () {
    if (arguments.length !== 0) {
      setStreamValue(stream, arguments[0])
    }
    return stream[kValue]
  }

  Object.defineProperties(stream, {
    [kValue]: { value, configurable: true, writable: true },
    [kChildren]: { value: new Set(), configurable: true, writable: true },
    [kParents]: { value: [], configurable: true, writable: true },
    [kFunction]: { value: NOOP, configurable: true, writable: true }
  })
  Object.setPrototypeOf(stream, Stream.prototype)
  return stream
}

let updates

function setStreamValue (stream, value) {
  const topUpdate = updates == null
  if (topUpdate) updates = getDescendants(stream)

  stream[kValue] = value
  Array.from(stream[kChildren]).forEach(child => {
    if (child.end === stream) return endStream(child)
    const update = updates.find(u => u.stream === child)
    if (!update) return updates.push({ stream: child, changed: [stream] })
    update.changed.push(stream)
  })

  if (topUpdate) {
    for (let update = updates.shift(); update; update = updates.shift()) {
      if (update.changed.length !== 0) {
        recalculateStream(update.stream, update.changed)
      }
    }
    updates = undefined
  }
}

function getDescendants (root) {
  const result = []
  const seen = new Set()
  function visit (stream) {
    if (seen.has(stream)) return
    seen.add(stream)
    stream[kChildren].forEach(visit)
    result.push({ stream, changed: [] })
  }
  visit(root)
  return result.reverse()
}

function recalculateStream (stream, changed) {
  const args = [...stream[kParents], stream, changed]
  const ret = stream[kFunction](...args)
  if (ret != null) setStreamValue(stream, ret)
}

function endStream (stream) {
  // disconnect from parents
  stream[kParents].forEach(parent => parent[kChildren].delete(stream))
  stream[kParents] = []
  stream.end[kParents] = []

  // set .end to true
  stream.end[kValue] = true

  // end all downstream from me too
  Array.from(stream[kChildren]).forEach(endStream)
}

// The workhorse for all derived streams
//
Stream.combine = function combine (fn, streams, opts = {}) {
  const derived = Stream(opts.initial)
  derived[kFunction] = fn
  derived[kParents] = streams.slice()
  streams.forEach(parent => parent[kChildren].add(derived))
  if (!opts.skip) recalculateStream(derived, streams)
  return derived
}

// common methods for all streams
Stream.prototype = {
  subscribe (fn) {
    const derived = this.map(fn, { skip: true })
    return () => derived.end(true)
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
