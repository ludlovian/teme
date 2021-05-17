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

test('async each', async () => {
  const t1 = teme([1, 2, 3]).toAsync()
  let acc = 0
  const t2 = t1.each(async v => (acc = acc + v))
  assert.equal(await t2.collect(), [1, 2, 3])
  assert.is(acc, 6)
})

test.run()
