'use strict'

function NOOP () {}

const METHODS = 'map,scan,dedupe,dedupeWith,when'.split(',')

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
    METHODS.forEach(meth => {
      this.fn[meth] = (...args) => this[meth](...args).fn
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
  static combine (fn, streams) {
    const derived = Stream.create()
    // any time any of the parent streams change, we re-run the
    // function.
    //
    // The unsubscribes are stored and used as as the detacher for this
    derived.detacher = callAll(
      streams.map(stream =>
        stream.subscribe(() => {
          const ret = fn(...[...streams, derived, [stream]])
          if (ret != null) derived.update(ret)
        })
      )
    )

    // Any time the `end`s of any of the parents are called, then we
    // call our own `end`. The unsubs again form the detacher for the `end`
    derived.addEnd()
    derived.end.detacher = callAll(
      streams.map(stream => stream.end.subscribe(x => derived.end.update(x)))
    )
    return derived
  }

  map (fn) {
    return Stream.combine(s => fn(s.value), [this])
  }

  dedupeWith (cmp) {
    let prev
    return Stream.combine((source, target) => {
      const val = source.value
      if (!cmp(prev, val)) target.update(val)
      prev = val
    }, [this])
  }

  dedupe () {
    return this.dedupeWith(identical)
  }

  static merge (...streams) {
    const merged = Stream.combine((...args) => {
      const changed = args.pop()
      const self = args.pop()
      changed.forEach(s => self.update(s.value))
    }, streams)
    return merged
  }

  scan (fn, accum) {
    const derived = this.map(value => {
      accum = fn(accum, value)
      return accum
    }, [this])
    derived.value = accum
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
}

function callAll (cbs) {
  return () => cbs.forEach(f => f())
}

function stream (...args) {
  const str = Stream.create(...args)
  str.addEnd()
  return str.fn
}

function combine (fn, streamFuncs) {
  return Stream.combine((...args) => {
    const changed = args.pop()
    const self = args.pop()
    return fn(...[...args.map(s => s.fn), self.fn, changed.map(s => s.fn)])
  }, streamFuncs.map(sf => sf.stream)).fn
}

function merge (...streamFuncs) {
  return Stream.merge(...streamFuncs.map(sf => sf.stream)).fn
}

function identical (a, b) {
  return a === b
}

Object.assign(stream, { combine, merge })
export default stream
