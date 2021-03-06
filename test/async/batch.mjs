import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

const DATA = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

test('async batch', async () => {
  const t = teme(DATA).toAsync()
  const groups = t.batch(3)
  const result = await groups.map(async group => group.collect()).collect()

  assert.ok(result.every(seq => seq.length <= 3))
  assert.equal(result.flat(), DATA)
})

test.run()
