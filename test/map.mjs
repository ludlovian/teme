import { test } from 'uvu'
import * as assert from 'uvu/assert'

import map from '../src/map.mjs'

test('map', t => {
  const src = [1, 2, 3, 4].map(n => ({ number: n, foo: 'bar' }))
  const fn = ({ number, ...rest }) => ({ ...rest, number: number * 10 })
  const res = [...map(fn)(src)]

  assert.is(res.length, 4)
  res.forEach(({ number, foo }, n) => {
    assert.is(foo, 'bar')
    assert.is(number, (n + 1) * 10)
  })
})

test('error', t => {
  const err = new Error('oops')
  const source = [1, 2, 3, 4, 5]
  const xform = map(n => {
    throw err
  })
  assert.throws(
    () => [...xform(source)],
    e => e === err
  )
})

test.run()
