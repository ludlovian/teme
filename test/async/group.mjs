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

test('async group complete', async () => {
  const t1 = teme(DATA).toAsync()
  const t2 = t1.group(x => x.foo)
  const t3 = t2.map(async ([key, group]) => [key, await group.collect()])
  const result = await t3.collect()
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

test('async group incomplete', async () => {
  const t1 = teme(DATA).toAsync()
  const t2 = t1.group(x => x.foo)
  const it2 = t2[Symbol.asyncIterator]()

  let item = await it2.next()
  let key = item.value[0]
  let group = item.value[1]
  assert.is(key, 1)
  assert.ok(teme.isTeme(group))
  assert.ok(group.isAsync)

  item = await it2.next()
  key = item.value[0]
  group = item.value[1]
  assert.is(key, 2)
  assert.ok(teme.isTeme(group))

  item = await it2.next()
  key = item.value[0]
  group = item.value[1]
  assert.is(key, 3)
  assert.ok(teme.isTeme(group))

  const { done } = await it2.next()
  assert.ok(done)
})

test.run()
