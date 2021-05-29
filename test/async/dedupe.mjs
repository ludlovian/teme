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

test('async dedupe', async () => {
  const t1 = teme(DATA).toAsync()
  const t2 = t1.dedupe()
  const result = (await t2.collect()).map(x => x.num)
  assert.equal(result, [1, 2, 3, 4, 5])
})

test('async dedupe with custom compare', async () => {
  const t1 = teme(DATA).toAsync()
  const t2 = t1.dedupe(compare)
  const result = (await t2.collect()).map(x => x.num)
  assert.equal(result, [1, 3, 5])
})

test.run()
