import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../src/index.mjs'

test('async tee', async () => {
  const t1 = teme([1, 2, 3]).toAsync()
  let t3
  const t2 = t1.tee(t => (t3 = t))

  const r1 = await t2.collect()
  assert.equal(r1, [1, 2, 3])

  const r2 = await t3.collect()
  assert.equal(r2, [1, 2, 3])
})

test('sync tee', async () => {
  const t1 = teme([1, 2, 3])
  let t3
  const t2 = t1.tee(t => (t3 = t))

  assert.is(t2.isAsync, true, 'converts to async')

  const r1 = await t2.collect()
  assert.equal(r1, [1, 2, 3])

  const r2 = await t3.collect()
  assert.equal(r2, [1, 2, 3])
})

test.run()
