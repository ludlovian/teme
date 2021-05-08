import { test } from 'uvu'
import * as assert from 'uvu/assert'

import sort from '../src/sort.mjs'

test('sorts with default', t => {
  const source = [3, 1, 4, 2]
  const stream = sort()(source)
  const result = [...stream]
  assert.equal(result, [1, 2, 3, 4])
})

test('sorts with fn', t => {
  const source = [[3], [1], [4], [2]]
  const fn = (a, b) => a[0] - b[0]
  const stream = sort(fn)(source)
  const result = [...stream]
  assert.equal(result, [[1], [2], [3], [4]])
})

test.run()
