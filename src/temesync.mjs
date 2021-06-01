import equal from 'pixutil/equal'
import { SITER, EMPTY, kIter, kChain, kRead, kNext } from './util.mjs'
import Teme from './teme.mjs'

export default class TemeSync extends Teme {
  static fromIterable (iterable) {
    return TemeSync.fromIterator(iterable[SITER]())
  }

  static fromIterator (iter) {
    const t = new TemeSync()
    return Object.defineProperties(t, {
      [kNext]: { value: () => iter.next(), configurable: true },
      [SITER]: { value: () => t[kIter](), configurable: true }
    })
  }

  [kIter] () {
    let curr = this[kChain].tail
    return { next: () => (curr = curr.next()) }
  }

  [kRead] () {
    const chain = this[kChain]
    try {
      const item = this[kNext]()
      return chain.add(item, !!item.done)
    } catch (error) {
      chain.add({ done: true }, true)
      throw error
    }
  }

  get isSync () {
    return true
  }

  toAsync () {
    const it = this[SITER]()
    return Teme.fromIterator({
      next: () => Promise.resolve(it.next())
    })
  }

  copy () {
    return TemeSync.fromIterator(this[SITER]())
  }

  map (fn, ctx) {
    const it = this[SITER]()
    return TemeSync.fromIterator({
      next () {
        const { value, done } = it.next()
        if (done) return { done }
        return { value: fn(value, ctx) }
      }
    })
  }

  filter (fn) {
    const it = this[SITER]()
    return TemeSync.fromIterator({
      next () {
        while (true) {
          const { value, done } = it.next()
          if (done) return { done }
          if (fn(value)) return { value }
        }
      }
    })
  }

  collect () {
    return [...this]
  }

  sort (fn) {
    let it
    const c = this.copy()
    return TemeSync.fromIterator({
      next () {
        if (!it) {
          const arr = c.collect()
          it = arr.sort(fn)[SITER]()
        }
        return it.next()
      }
    })
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
    const it = this[SITER]()
    let tgt = EMPTY
    let key = EMPTY
    let item = {}

    return TemeSync.fromIterator({ next })

    function next () {
      if (item.done) return item
      while (equal(key, tgt)) {
        item = it.next()
        if (item.done) return item
        key = fn(item.value)
      }
      tgt = key
      const grouper = TemeSync.fromIterator({ next: gnext })
      const value = [key, grouper]
      return { value }
    }

    function gnext () {
      if (!equal(key, tgt)) return { done: true }
      const _item = item
      item = it.next()
      key = item.done ? EMPTY : fn(item.value)
      return _item
    }
  }

  on (fn, ctx) {
    for (const v of this) {
      fn(v, ctx)
    }
  }
}
