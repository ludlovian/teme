import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

test('async copy', async () => {
  const t1 = teme([1, 2, 3]).toAsync()
  const t2 = t1.copy()

  const r1 = await t1.collect()
  const r2 = await t2.collect()

  assert.equal(r1, [1, 2, 3])
  assert.equal(r1, r2)
})

test('async copy that throws', async () => {
  let err
  const t1 = teme(
    (async function * () {
      yield 17
      err = new Error('oops')
      throw err
    })()
  )

  const t2 = t1.copy()
  const it = t2[Symbol.asyncIterator]()
  let item = await it.next()
  assert.is(item.value, 17)

  await it
    .next()
    .then(assert.unreachable)
    .catch(e => assert.is(e, err))

  item = await it.next()
  assert.is(item.done, true)
})

test.run()
