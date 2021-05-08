import { test } from 'uvu'
import * as assert from 'uvu/assert'

import pipeline from '../src/pipeline.mjs'

test('pipeline', () => {
  const source = [1, 2, 3, 4]
  const fn = pipeline(add1, times10)
  const stream = fn(source)
  const result = [...stream]
  assert.equal(result, [20, 30, 40, 50])
})

function * add1 (src) {
  for (const n of src) {
    yield n + 1
  }
}

function * times10 (src) {
  for (const n of src) {
    yield n * 10
  }
}

test.run()
