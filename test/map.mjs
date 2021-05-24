import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../src/index.mjs'

test('sync map', () => {
  const t1 = teme([1, 2, 3])
  const t2 = t1.map(v => 10 * v)
  const t3 = t1.copy()
  const res2 = [...t2]
  const res3 = [...t3]
  assert.equal(res3, [1, 2, 3], 'original')
  assert.equal(res2, [10, 20, 30], 'sync map applied')
})

test('sync map with context', () => {
  const ctx = { foo: 'bar' }
  const t1 = teme([1, 2, 3])
  const t2 = t1.map((v, ctx) => ctx.foo + v, ctx)
  const result = t2.collect()
  assert.equal(result, ['bar1', 'bar2', 'bar3'])
})

test('async map', async () => {
  const g = (async function * () {
    yield * [1, 2, 3]
  })()
  const t1 = teme(g)
  const t2 = t1.map(v => Promise.resolve(10 * v))
  const result = []
  for await (const v of t2) result.push(v)
  assert.equal(result, [10, 20, 30], 'async map applied')
})

test('async map with context', async () => {
  const ctx = { foo: 'bar' }
  const t1 = teme([1, 2, 3]).toAsync()
  const t2 = t1.map((v, ctx) => ctx.foo + v, ctx)
  const result = await t2.collect()
  assert.equal(result, ['bar1', 'bar2', 'bar3'])
})

test.run()
