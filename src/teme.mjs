import Pipe from 'pipe'
import equal from 'pixutil/equal'

import { AITER, EMPTY, returnThis } from './util.mjs'

export default class Teme {
  static from (src) {
    if (src instanceof Teme) return src
    const t = new Teme()
    const it = src[AITER]()
    async function next () {
      const item = await it.next()
      Object.assign(this, item)
      return item
    }
    Object.defineProperties(t, {
      [AITER]: { value: returnThis, configurable: true },
      next: { value: next, configurable: true }
    })
    return t
  }

  constructor (src) {
    this.done = undefined
    this.value = undefined
  }

  get isSync () {
    return false
  }

  get isAsync () {
    return !this.isSync
  }

  toAsync () {
    return this
  }

  map (fn) {
    return Teme.from(gen(this))
    async function * gen (src) {
      for await (const v of src) yield await fn(v)
    }
  }

  filter (fn) {
    return Teme.from(gen(this))
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
    return Teme.from(gen(this))
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
    return Teme.from(gen(this))
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
        yield [key, Teme.from(grouper())]
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

  batch (size) {
    let n = 0
    const addCtx = value => ({ value, seq: (n++ / size) | 0 })
    const remCtx = ({ value }) => value
    const seqKey = ({ seq }) => seq
    const pullGroup = ([, group]) => group.map(remCtx)
    return this.map(addCtx)
      .group(seqKey)
      .map(pullGroup)
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
    fn(Teme.from(reader))
    async function * gen (src) {
      for await (const v of src) {
        await writer.write(v)
        yield v
      }
      await writer.close()
    }
    return Teme.from(gen(this))
  }
}
