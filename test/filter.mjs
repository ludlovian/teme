import { test } from 'uvu'
import * as assert from 'uvu/assert'

import filter from '../src/filter.mjs'

test('map', t => {
  const src = [1, 2, 3, 4, 5, 6].map(n => ({ number: n, foo: 'bar' }))
  const fn = ({ number }) => number % 2 === 0
  const res = [...filter(fn)(src)]

  assert.is(res.length, 3)
  res.forEach(({ number, foo }, n) => {
    assert.is(foo, 'bar')
    assert.is(number, (n + 1) * 2)
  })
})

test('error', t => {
  const err = new Error('oops')
  const source = [1, 2, 3, 4, 5]
  const xform = filter(n => {
    throw err
  })
  assert.throws(
    () => [...xform(source)],
    e => e === err
  )
})

test.run()
