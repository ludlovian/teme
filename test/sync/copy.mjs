import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

test('sync copy', () => {
  const t1 = teme([1, 2, 3])
  const t2 = t1.copy()

  const r1 = [...t1]
  const r2 = [...t2]

  assert.equal(r1, [1, 2, 3])
  assert.equal(r1, r2)
})

test('sync copy that throws', () => {
  let err
  const t1 = teme(
    (function * () {
      yield 17
      err = new Error('oops')
      throw err
    })()
  )

  const t2 = t1.copy()
  const it = t2[Symbol.iterator]()
  let item = it.next()
  assert.is(item.value, 17)

  assert.throws(
    () => it.next(),
    e => e === err
  )

  item = it.next()
  assert.is(item.done, true)
})

test.run()
