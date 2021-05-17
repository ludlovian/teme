import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../src/index.mjs'

test('sync map', () => {
  const t1 = teme([1, 2, 3])
  const t2 = t1.map(v => 10 * v)
  const result = [...t2]
  assert.equal(result, [10, 20, 30], 'sync map applied')
})

test('async map', async () => {
  const g = (async function * () {
    yield * [1, 2, 3]
  })()
  const t1 = teme(g)
  const t2 = t1.map(v => 10 * v)
  const result = []
  for await (const v of t2) result.push(v)
  assert.equal(result, [10, 20, 30], 'async map applied')
})

test.run()
