'use strict'

function NOOP () {}

// methods which return a stream, so the function versions must return
// the function version of the stream
const STREAM_METHODS = [
  'map',
  'scan',
  'dedupe',
  'dedupeWith',
  'when',
  'throttle',
  'debounce'
]
// other methods copied verbatimn to the function version
const METHODS = ['changed', 'subscribe']

class Stream {
  static create (...args) {
    return new Stream(...args)
  }

  constructor (v) {
    // current value of the stream
    this.value = v
    // notify callbacks to run on change
    this.notify = new Set()
    // fn which detaches this stream from its parents
    this.detacher = NOOP

    // function version of the stream. Call with no args
    // to get current value. Or with args to set.
    this.fn = this.update.bind(this)
    // to map back from the function to the object
    this.fn.stream = this

    // make function versions of the methods
    STREAM_METHODS.forEach(meth => {
      this.fn[meth] = (...args) => this[meth](...args).fn
    })
    METHODS.forEach(meth => {
      this.fn[meth] = (...args) => this[meth](...args)
    })
  }

  subscribe (fn) {
    this.notify.add(fn)
    return () => this.notify.delete(fn)
  }

  endStream () {
    this.notify.clear()
    this.detacher()
    this.detacher = NOOP
  }

  addEnd () {
    // and end stream is a stream which, if updated, ends the stream
    // (along with itself)
    this.end = Stream.create()
    this.end.subscribe(() => {
      this.end.endStream()
      this.endStream()
    })
    // the fn version of the stream also has an end, which is the fn version
    // of `stream.end`
    this.fn.end = this.end.fn
  }

  update (v) {
    if (arguments.length !== 0) {
      this.value = v
      // work off a copy as some notifieds might change this
      // as we are iterating (e.g. ends)
      const notifies = Array.from(this.notify)
      notifies.forEach(f => f(v))
    }
    return this.value
  }

  // creates a new Stream which is derived from applying a function
  // to a list of (upstream) Streams
  //
  // The function has signature
  // (stream,...,stream, self, Stream[] changed) => value
  // where `changed` is the list of Stream objects that have changed.
  //
  // options:
  //  - skip - do not run the function initially
  //  - initial - initial value (if .skip set)
  //
  static combine (fn, streams, opts = {}) {
    const derived = Stream.create()
    function recalcDerived (changed) {
      const ret = fn(...[...streams, derived, changed])
      if (ret != null) derived.update(ret)
    }

    if (opts.skip) {
      derived.value = opts.initial
    } else {
      recalcDerived(streams)
    }

    // any time any of the parent streams change, we re-run the
    // function.
    //
    // The unsubscribes are stored and used as as the detacher for this
    derived.detacher = callAll(
      streams.map(stream => stream.subscribe(() => recalcDerived([stream])))
    )

    // Any time the `end`s of any of the parents are called, then we
    // call our own `end`. The unsubs again form the detacher for the `end`
    derived.addEnd()
    derived.end.detacher = callAll(
      streams.map(stream => stream.end.subscribe(x => derived.end.update(x)))
    )
    return derived
  }

  map (fn, opts) {
    return Stream.combine(s => fn(s.value), [this], opts)
  }

  dedupe (cmp, opts) {
    if (cmp && typeof cmp === 'object') {
      opts = cmp
      cmp = undefined
    }
    cmp = cmp || identical
    opts = opts || {}
    let prev
    if (!opts.skip) prev = this.value
    return Stream.combine(
      (source, target) => {
        const val = source.value
        if (!cmp(prev, val)) target.update(val)
        prev = val
      },
      [this],
      { skip: true, initial: prev }
    )
  }

  static merge (...streams) {
    const merged = Stream.combine(
      (...args) => {
        const changed = args.pop()
        const self = args.pop()
        changed.forEach(s => self.update(s.value))
      },
      streams,
      { skip: true }
    )
    return merged
  }

  scan (fn, accum) {
    const derived = this.map(
      value => {
        accum = fn(accum, value)
        return accum
      },
      { skip: true, initial: accum }
    )
    return derived
  }

  when (fn) {
    // return a stream of promises which resolve when the condition
    // is true
    let resolver
    let isResolved
    const freshPromise = () =>
      new Promise(resolve => {
        resolver = resolve
      })

    const initialPromise = freshPromise()
    if (fn(this.value)) {
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
  }

  changed () {
    // returns a promise which resolves when this stream next updates
    return new Promise(resolve => {
      const monitor = this.map(
        x => {
          resolve(x)
          monitor.end.update(true)
        },
        { skip: true }
      )
    })
  }

  throttle (period) {
    // returns a stream which updates at most every `period` ms
    let timeout
    let callDue
    const update = () => {
      // update this stream, and reset the callDue flag
      ret.update(this.value)
      callDue = false
    }
    const startTimer = () =>
      setTimeout(() => {
        // if we have called whilst the timer has been running, then
        // do the throttled update, and set another timer going
        if (callDue) {
          update()
          timeout = startTimer()
        } else {
          // no call has happened during the timer, so stop for now
          timeout = null
        }
      }, period)
    const ret = Stream.combine(
      () => {
        // if we already have a timer going, then flag it needs to perform an update
        if (timeout) {
          callDue = true
        } else {
          // we do the `leading` edge call here, and then set a timer
          update()
          timeout = startTimer()
        }
      },
      [this],
      { skip: true }
    )
    return ret
  }

  debounce (period) {
    // create a stream which updates after a quiet period of `period` ms
    let timeout
    const update = () => {
      ret.update(this.value)
      timeout = null
    }
    const startTimer = () => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(update, period)
    }
    const ret = Stream.combine(startTimer, [this], { skip: true })
    return ret
  }
}

function callAll (cbs) {
  return () => cbs.forEach(f => f())
}

function stream (...args) {
  const str = Stream.create(...args)
  str.addEnd()
  return str.fn
}

function combine (fn, streamFuncs, initial) {
  return Stream.combine(
    (...args) => {
      const changed = args.pop()
      const self = args.pop()
      return fn(...[...args.map(s => s.fn), self.fn, changed.map(s => s.fn)])
    },
    streamFuncs.map(sf => sf.stream),
    initial
  ).fn
}

function merge (...streamFuncs) {
  return Stream.merge(...streamFuncs.map(sf => sf.stream)).fn
}

function identical (a, b) {
  return a === b
}

Object.assign(stream, { combine, merge })
export default stream
