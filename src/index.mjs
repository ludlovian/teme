import { Teme } from './teme.mjs'
import { TemeSync } from './temesync.mjs'
import Pipe from './pipe.mjs'
import join from './join.mjs'
import { AITER, SITER } from './util.mjs'

export default function teme (s) {
  if (s instanceof Teme) return s
  if (typeof s[SITER] === 'function') return TemeSync.fromIterable(s)
  if (typeof s[AITER] === 'function') return Teme.fromIterable(s)
  throw new Error('Not iterable')
}

teme.join = join

teme.pipe = function pipe () {
  const { next, ...pipe } = new Pipe()
  return Object.assign(Teme.fromIterator({ next }), pipe)
}

teme.isTeme = function isTeme (t) {
  return t instanceof Teme
}
