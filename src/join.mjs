import { Teme } from './teme.mjs'
import { SITER, AITER } from './util.mjs'

export default function join (...sources) {
  const iters = sources.map(makeIter)
  const nexts = iters.map(makeNext)

  return Teme.fromIterator({ next })

  async function next () {
    while (true) {
      if (!nexts.some(Boolean)) return { done: true }
      const [item, ix] = await Promise.race(nexts.filter(Boolean))
      const { done, value } = item
      if (done) {
        nexts[ix] = null
      } else {
        nexts[ix] = makeNext(iters[ix], ix)
        return { value: [value, ix] }
      }
    }
  }

  function makeIter (src) {
    if (src[AITER]) return src[AITER]()
    const it = src[SITER]()
    return { next: async () => it.next() }
  }

  function makeNext (iter, index) {
    return Promise.resolve(iter.next())
      .then(item => [item, index])
      .catch(err => {
        nexts.splice(0)
        throw Object.assign(err, { index })
      })
  }
}
