import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

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
