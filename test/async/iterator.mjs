import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

test('async iterator', async () => {
  const t = teme(
    (async function * () {
      let i = 0
      while (true) yield ++i
    })()
  )
  assert.is(t.isAsync, true, 'is an async stream')

  const it1 = t[Symbol.asyncIterator]()
  const it2 = t[Symbol.asyncIterator]()

  let [pGet1, pGet2, get1, get2] = []

  pGet1 = it1.next()
  pGet2 = it2.next()

  get1 = await pGet1
  get2 = await pGet2

  assert.is(get1.value, 1)
  assert.is(!!get1.done, false)
  assert.is(get2.value, 1)
  assert.is(!!get2.done, false)
  assert.is(t.current.value, 1)

  pGet1 = it1.next()
  pGet2 = it2.next()

  get1 = await pGet1
  get2 = await pGet2

  assert.is(get1.value, 2)
  assert.is(!!get1.done, false)
  assert.is(get2.value, 2)
  assert.is(!!get2.done, false)
  assert.is(t.current.value, 2)
})

test('async ending iterator', async () => {
  const t = teme(
    (async function * () {
      yield 17
    })()
  )
  assert.is(t.isAsync, true, 'is an async stream')

  const it1 = t[Symbol.asyncIterator]()
  const it2 = t[Symbol.asyncIterator]()

  let [pGet1, pGet2, get1, get2] = []

  pGet1 = it1.next()
  pGet2 = it2.next()

  get1 = await pGet1
  get2 = await pGet2

  assert.is(get1.value, 17)
  assert.is(!!get1.done, false)
  assert.is(get2.value, 17)
  assert.is(!!get2.done, false)
  assert.is(t.current.value, 17)

  pGet1 = it1.next()
  pGet2 = it2.next()

  get1 = await pGet1
  get2 = await pGet2

  assert.is(!!get1.done, true)
  assert.is(!!get2.done, true)
  assert.is(t.current.done, true)
})

test('async error iterator', async () => {
  let err
  const t = teme(
    (async function * () {
      err = new Error('oops')
      throw err
    })()
  )

  const it = t[Symbol.asyncIterator]()
  await it
    .next()
    .then(assert.unreachable)
    .catch(e => assert.is(e, err))

  const item = await it.next()
  assert.is(item.done, true)
})

test.run()
