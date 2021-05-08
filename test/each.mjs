import { test } from 'uvu'
import * as assert from 'uvu/assert'

import each from '../src/each.mjs'

test('each', t => {
  const src = [1, 2, 3, 4]
  const result = []
  const fn = n => result.push(n * 10)
  const arr = [...each(fn)(src)]

  assert.equal(arr, [1, 2, 3, 4])
  assert.equal(result, [10, 20, 30, 40])
})

test('error', t => {
  const err = new Error('oops')
  const source = [1, 2, 3, 4, 5]
  const xform = each(n => {
    throw err
  })
  assert.throws(
    () => [...xform(source)],
    e => e === err
  )
})

test.run()
