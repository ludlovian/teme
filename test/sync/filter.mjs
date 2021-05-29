import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

test('sync filter', () => {
  const t1 = teme([1, 2, 3, 4])
  const t2 = t1.filter(v => v % 2 === 0)
  const result = [...t2]
  assert.equal(result, [2, 4])
})

test.run()
