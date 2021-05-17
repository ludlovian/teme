import equal from 'pixutil/equal'
import { SITER, EMPTY, returnThis } from './util.mjs'
import Teme from './teme.mjs'

export default class TemeSync extends Teme {
  static from (src) {
    if (src instanceof Teme) return src
    const t = new TemeSync()
    const it = src[SITER]()
    function next () {
      const item = it.next()
      Object.assign(this, item)
      return item
    }
    Object.defineProperties(t, {
      [SITER]: { value: returnThis, configurable: true },
      next: { value: next, configurable: true }
    })
    return t
  }

  get isSync () {
    return true
  }

  toAsync () {
    return Teme.from(gen(this))
    async function * gen (src) {
      yield * src
    }
  }

  map (fn, ctx) {
    return TemeSync.from(gen(this))
    function * gen (src) {
      for (const v of src) yield fn(v, ctx)
    }
  }

  filter (fn) {
    return TemeSync.from(gen(this))
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
    return TemeSync.from(this.collect().sort(fn))
  }

  each (fn, ctx) {
    return this.map(v => {
      fn(v, ctx)
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
    return TemeSync.from(gen(this))
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
        yield [key, TemeSync.from(grouper())]
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
