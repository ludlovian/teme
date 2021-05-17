import Pipe from 'pipe'

import Teme from './teme.mjs'
import TemeSync from './temesync.mjs'
import { AITER, SITER } from './util.mjs'

export default function teme (s) {
  if (typeof s[SITER] === 'function') return TemeSync.from(s)
  if (typeof s[AITER] === 'function') return Teme.from(s)
  throw new Error('Not iterable')
}

teme.join = function join (...sources) {
  const [reader, writer] = new Pipe()
  sources.forEach(feed)
  let open = sources.length
  if (!open) writer.close()
  return Teme.from(reader)

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
