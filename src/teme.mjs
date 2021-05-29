import equal from 'pixutil/equal'
import Chain from 'chain'

import { AITER, SITER, EMPTY, kIter, kChain, kRead, kNext } from './util.mjs'

export default class Teme {
  static fromIterable (iterable) {
    return Teme.fromIterator(iterable[AITER]())
  }

  static fromIterator (iter) {
    const t = new Teme()
    return Object.defineProperties(t, {
      [kNext]: { value: () => iter.next(), configurable: true },
      [AITER]: { value: () => t[kIter](), configurable: true }
    })
  }

  constructor () {
    const chain = new Chain({ atEnd: () => this[kRead]() })
    Object.defineProperty(this, kChain, { value: chain, configurable: true })
  }

  [kIter] () {
    let curr = this[kChain].tail
    return { next: async () => (curr = await curr.next()) }
  }

  async [kRead] () {
    const chain = this[kChain]
    try {
      const item = await this[kNext]()
      return chain.add(item, !!item.done)
    } catch (error) {
      chain.add({ done: true }, true)
      throw error
    }
  }

  get current () {
    const { value, done } = this[kChain].tail
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
