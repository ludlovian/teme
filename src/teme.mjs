import equal from 'pixutil/equal'

import { AITER, SITER, EMPTY } from './util.mjs'

export default class Teme {
  static fromIterable (iterable) {
    return Teme.fromIterator(iterable[AITER]())
  }

  static fromIterator (iter) {
    const t = new Teme()
    t._next = iter.next.bind(iter)
    t[AITER] = t._iterator.bind(t)
    return t
  }

  constructor () {
    this._current = {}
  }

  _iterator () {
    let curr = this._current
    return {
      next: async () => {
        if (!curr.next) curr.next = this._read()
        curr = await curr.next
        return { value: curr.value, done: curr.done }
      }
    }
  }

  async _read () {
    try {
      const next = await this._next()
      if (next.done) next.next = Promise.resolve(next)
      return (this._current = next)
    } catch (error) {
      const next = { done: true }
      next.next = this._current.next = Promise.resolve(next)
      this._current = next
      throw error
    }
  }

  get current () {
    const { value, done } = this._current
    return { value, done }
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

  copy () {
    return Teme.fromIterator(this[AITER]())
  }

  map (fn, ctx) {
    const it = this[AITER]()
    return Teme.fromIterator({
      async next () {
        const { value, done } = await it.next()
        if (done) return { done }
        return { value: await fn(value, ctx) }
      }
    })
  }

  filter (fn) {
    const it = this[AITER]()
    return Teme.fromIterator({
      async next () {
        while (true) {
          const { value, done } = await it.next()
          if (done) return { done }
          if (await fn(value)) return { value }
        }
      }
    })
  }

  async collect () {
    const arr = []
    for await (const v of this) arr.push(v)
    return arr
  }

  sort (fn) {
    let it
    const c = this.copy()
    return Teme.fromIterator({
      async next () {
        if (!it) {
          const arr = await c.collect()
          it = arr.sort(fn)[SITER]()
        }
        return it.next()
      }
    })
  }

  each (fn, ctx) {
    return this.map(async v => {
      await fn(v, ctx)
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
    const it = this[AITER]()
    let tgt = EMPTY
    let key = EMPTY
    let item = {}

    return Teme.fromIterator({ next })

    async function next () {
      if (item.done) return item
      while (equal(key, tgt)) {
        item = await it.next()
        if (item.done) return item
        key = fn(item.value)
      }
      tgt = key
      const grouper = Teme.fromIterator({ next: gnext })
      const value = [key, grouper]
      return { value }
    }

    async function gnext () {
      if (!equal(key, tgt)) return { done: true }
      const _item = item
      item = await it.next()
      if (!item.done) key = fn(item.value)
      return _item
    }
  }

  batch (size) {
    let n = 0
    const addCtx = value => ({ value, seq: Math.floor(n++ / size) })
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

  consume () {
    return this.on(() => undefined)
  }

  async on (fn, ctx) {
    for await (const v of this) {
      await fn(v, ctx)
    }
  }
}
