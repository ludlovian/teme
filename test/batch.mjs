import { test } from 'uvu'
import * as assert from 'uvu/assert'

import batch from '../src/batch.mjs'

test('batches with no remainder', t => {
  const source = [1, 2, 3, 4]
  const result = [...batch(2)(source)]
  assert.equal(result, [
    [1, 2],
    [3, 4]
  ])
})

test('batches with remainder', t => {
  const source = [1, 2, 3, 4, 5]
  const result = [...batch(3)(source)]
  assert.equal(result, [
    [1, 2, 3],
    [4, 5]
  ])
})

test.run()
