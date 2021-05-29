import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

const DATA = [
  { foo: 'bar', num: 1 },
  { foo: 'bar', num: 1 },
  { foo: 'bar', num: 2 },
  { foo: 'baz', num: 3 },
  { foo: 'baz', num: 3 },
  { foo: 'baz', num: 4 },
  { foo: 'quux', num: 5 }
]

function compare (a, b) {
  return a.foo === b.foo
}

test('sync dedupe', () => {
  const t1 = teme(DATA)
  const t2 = t1.dedupe()
  const result = t2.collect().map(x => x.num)
  assert.equal(result, [1, 2, 3, 4, 5])
})

test('sync dedupe with custom compare', () => {
  const t1 = teme(DATA)
  const t2 = t1.dedupe(compare)
  const result = t2.collect().map(x => x.num)
  assert.equal(result, [1, 3, 5])
})

test.run()
