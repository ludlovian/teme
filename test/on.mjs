import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../src/index.mjs'

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

test('async each', async () => {
  const t1 = teme([1, 2, 3]).toAsync()
  let acc = 0
  await t1.on(async v => (acc = acc + v))
  assert.is(acc, 6)
})

test('async each with context', async () => {
  const t1 = teme([1, 2, 3]).toAsync()
  let acc = 0
  const fn = async (v, ctx) => (acc = acc + v * ctx.mul)
  await t1.on(fn, { mul: 4 })
  assert.is(acc, 24)
})

test.run()
