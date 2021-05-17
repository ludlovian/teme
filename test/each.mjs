import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../src/index.mjs'

test('sync each', () => {
  const t1 = teme([1, 2, 3])
  let acc = 0
  const t2 = t1.each(v => (acc = acc + v))
  assert.equal(t2.collect(), [1, 2, 3])
  assert.is(acc, 6)
})

test('sync each with context', () => {
  const t1 = teme([1, 2, 3])
  let acc = 0
  const fn = (v, ctx) => (acc = acc + v * ctx.mul)
  const t2 = t1.each(fn, { mul: 4 })
  assert.equal(t2.collect(), [1, 2, 3])
  assert.is(acc, 24)
})

test('async each', async () => {
  const t1 = teme([1, 2, 3]).toAsync()
  let acc = 0
  const t2 = t1.each(async v => (acc = acc + v))
  assert.equal(await t2.collect(), [1, 2, 3])
  assert.is(acc, 6)
})

test('async each with context', async () => {
  const t1 = teme([1, 2, 3]).toAsync()
  let acc = 0
  const fn = async (v, ctx) => (acc = acc + v * ctx.mul)
  const t2 = t1.each(fn, { mul: 4 })
  assert.equal(await t2.collect(), [1, 2, 3])
  assert.is(acc, 24)
})

test.run()
