import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

test('sync on', () => {
  const t1 = teme([1, 2, 3])
  let acc = 0
  t1.on(v => (acc = acc + v))
  assert.is(acc, 6)
})

test('sync each with context', () => {
  const t1 = teme([1, 2, 3])
  let acc = 0
  const fn = (v, ctx) => (acc = acc + v * ctx.mul)
  t1.on(fn, { mul: 4 })
  assert.is(acc, 24)
})

test.run()
