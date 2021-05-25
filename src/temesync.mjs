import equal from 'pixutil/equal'
import { SITER, EMPTY } from './util.mjs'
import Teme from './teme.mjs'

export default class TemeSync extends Teme {
  static fromIterable (iterable) {
    return TemeSync.fromIterator(iterable[SITER]())
  }

  static fromIterator (iter) {
    const t = new TemeSync()
    t._next = iter.next.bind(iter)
    t[SITER] = t._iterator.bind(t)
    return t
  }

  _iterator () {
    let curr = this._current
    return {
      next: () => {
        if (!curr.next) curr.next = this._read()
        curr = curr.next
        return { value: curr.value, done: curr.done }
      }
    }
  }

  _read () {
    try {
      const next = this._next()
      if (next.done) next.next = next
      return (this._current = next)
    } catch (error) {
      const next = { done: true }
      next.next = this._current.next = next
      this._current = next
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
      if (!item.done) key = fn(item.value)
      return _item
    }
  }

  on (fn, ctx) {
    for (const v of this) {
      fn(v, ctx)
    }
  }
}
