import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

test('sync collect', () => {
  const t1 = teme([1, 2, 3])
  const result = t1.collect()
  assert.equal(result, [1, 2, 3])
})

test.run()
