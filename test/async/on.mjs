import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

test('async on', async () => {
  const t1 = teme([1, 2, 3]).toAsync()
  let acc = 0
  await t1.on(async v => (acc = acc + v))
  assert.is(acc, 6)
})

test('async on with context', async () => {
  const t1 = teme([1, 2, 3]).toAsync()
  let acc = 0
  const fn = async (v, ctx) => (acc = acc + v * ctx.mul)
  await t1.on(fn, { mul: 4 })
  assert.is(acc, 24)
})

test.run()
