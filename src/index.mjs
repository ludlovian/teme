import Pipe from 'pipe'
import equal from 'pixutil/equal'

const AITER = Symbol.asyncIterator
const SITER = Symbol.iterator
/* c8 ignore next */
const EMPTY = () => {}

export default function teme (s) {
  if (s instanceof Teme) return s
  if (typeof s[SITER] === 'function') return new TemeSync(s)
  if (typeof s[AITER] === 'function') return new Teme(s)
  throw new Error('Not iterable')
}

class Teme {
  constructor (src) {
    this.done = undefined
    this.value = undefined
    if (src) {
      const it = src[AITER]()
      const next = async () => {
        const item = await it.next()
        Object.assign(this, item)
        return item
      }
      Object.defineProperties(this, {
        [AITER]: { value: returnThis, configurable: true },
        next: { value: next, configurable: true }
      })
    }
  }

  get isSync () {
    return this instanceof TemeSync
  }

  get isAsync () {
    return !this.isSync
  }

  toAsync () {
    return this
  }

  map (fn) {
    return teme(gen(this))
    async function * gen (src) {
      for await (const v of src) yield await fn(v)
    }
  }

  filter (fn) {
    return teme(gen(this))
    async function * gen (src) {
      for await (const v of src) {
        if (fn(v)) yield v
      }
    }
  }

  async collect () {
    const arr = []
    for await (const v of this) arr.push(v)
    return arr
  }

  sort (fn) {
    return teme(gen(this))
    async function * gen (src) {
      const arr = await src.collect()
      yield * arr.sort(fn)
    }
  }

  each (fn) {
    return this.map(async v => {
      await fn(v)
      return v
    })
  }

  scan (fn, accum) {
    return this.map(async v => {
      accum = await fn(accum, v)
      return accum
    })
  }

  group (fn) {
    return teme(gen(this))
    async function * gen (src) {
      let tgt = EMPTY
      let key = EMPTY
      let item = {}
      while (!item.done) {
        while (equal(key, tgt)) {
          item = await src.next()
          if (item.done) return
          key = fn(item.value)
        }
        tgt = key
        yield [key, teme(grouper())]
      }
      async function * grouper () {
        while (equal(key, tgt)) {
          yield item.value
          item = await src.next()
          if (item.done) return
          key = fn(item.value)
        }
      }
    }
  }

  dedupe (fn = equal) {
    let prev = EMPTY
    return this.filter(v => {
      if (fn(prev, v)) return false
      prev = v
      return true
    })
  }

  async consume () {
    while (true) {
      const { done } = await this.next()
      if (done) return
    }
  }

  tee (fn, size) {
    const [reader, writer] = new Pipe(size)
    fn(teme(reader))
    async function * gen (src) {
      for await (const v of src) {
        await writer.write(v)
        yield v
      }
      await writer.close()
    }
    return teme(gen(this))
  }
}

teme.join = function join (...sources) {
  const [reader, writer] = new Pipe()
  sources.forEach(feed)
  let open = sources.length
  if (!open) writer.close()
  return teme(reader)

  async function feed (stream, index) {
    try {
      for await (const value of stream) {
        if (writer.closed) return
        await writer.write([value, index])
      }
      if (!--open) await writer.close()
    } catch (error) {
      writer.throw(Object.assign(error, { index }))
    }
  }
}

teme.isTeme = function isTeme (t) {
  return t instanceof Teme
}

class TemeSync extends Teme {
  constructor (src) {
    super()
    const it = src[SITER]()
    const next = () => {
      const item = it.next()
      Object.assign(this, item)
      return item
    }
    Object.defineProperties(this, {
      [SITER]: { value: returnThis, configurable: true },
      next: { value: next, configurable: true }
    })
  }

  toAsync () {
    return teme(gen(this))
    async function * gen (src) {
      yield * src
    }
  }

  map (fn) {
    return teme(gen(this))
    function * gen (src) {
      for (const v of src) yield fn(v)
    }
  }

  filter (fn) {
    return teme(gen(this))
    function * gen (src) {
      for (const v of src) {
        if (fn(v)) yield v
      }
    }
  }

  collect () {
    return [...this]
  }

  sort (fn) {
    return teme(this.collect().sort(fn))
  }

  each (fn) {
    return this.map(v => {
      fn(v)
      return v
    })
  }

  scan (fn, accum) {
    return this.map(v => {
      accum = fn(accum, v)
      return accum
    })
  }

  group (fn) {
    return teme(gen(this))
    function * gen (src) {
      let tgt = EMPTY
      let key = EMPTY
      let item = {}
      while (!item.done) {
        while (equal(key, tgt)) {
          item = src.next()
          if (item.done) return
          key = fn(item.value)
        }
        tgt = key
        yield [key, teme(grouper())]
      }
      function * grouper () {
        while (equal(key, tgt)) {
          yield item.value
          item = src.next()
          if (item.done) return
          key = fn(item.value)
        }
      }
    }
  }

  consume () {
    while (true) {
      const { done } = this.next()
      if (done) return
    }
  }

  tee (fn) {
    return this.toAsync().tee(fn)
  }
}

function returnThis () {
  return this
}
