import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

const DATA = [
  { foo: 1, bar: 10 },
  { foo: 1, bar: 11 },
  { foo: 2, bar: 20 },
  { foo: 2, bar: 21 },
  { foo: 3, bar: 30 }
]

test('sync group complete', () => {
  const t1 = teme(DATA)
  const t2 = t1.group(x => x.foo)
  const t3 = t2.map(([key, group]) => [key, group.collect()])
  const result = t3.collect()
  assert.equal(result, [
    [
      1,
      [
        { foo: 1, bar: 10 },
        { foo: 1, bar: 11 }
      ]
    ],
    [
      2,
      [
        { foo: 2, bar: 20 },
        { foo: 2, bar: 21 }
      ]
    ],
    [3, [{ foo: 3, bar: 30 }]]
  ])
})

test('sync group incomplete', () => {
  const t1 = teme(DATA)
  const t2 = t1.group(x => x.foo)

  const it2 = t2[Symbol.iterator]()
  let item = it2.next().value
  let key = item[0]
  let group = item[1]
  assert.is(key, 1)
  assert.ok(teme.isTeme(group))

  item = it2.next().value
  key = item[0]
  group = item[1]
  assert.is(key, 2)
  assert.ok(teme.isTeme(group))

  item = it2.next().value
  key = item[0]
  group = item[1]
  assert.is(key, 3)
  assert.ok(teme.isTeme(group))

  const { done } = it2.next()
  assert.ok(done)
})

test.run()
