import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../src/index.mjs'

test('sync copy', () => {
  const t1 = teme([1, 2, 3])
  const t2 = t1.copy()

  const r1 = [...t1]
  const r2 = [...t2]

  assert.equal(r1, [1, 2, 3])
  assert.equal(r1, r2)
})

test('async copy', async () => {
  const t1 = teme([1, 2, 3]).toAsync()
  const t2 = t1.copy()

  const r1 = await t1.collect()
  const r2 = await t2.collect()

  assert.equal(r1, [1, 2, 3])
  assert.equal(r1, r2)
})

test.run()
