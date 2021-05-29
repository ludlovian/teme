import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

test('sync consume', () => {
  const t = teme([1, 2, 3])
  t.consume()
  const { done } = t[Symbol.iterator]().next()
  assert.is(done, true)
})

test.run()
