import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

test('sync iterator', () => {
  const t = teme(
    (function * () {
      let i = 0
      while (true) yield ++i
    })()
  )
  assert.is(t.isSync, true, 'is a sync stream')

  const it1 = t[Symbol.iterator]()
  const it2 = t[Symbol.iterator]()

  let [get1, get2] = []

  get1 = it1.next()
  get2 = it2.next()

  assert.is(get1.value, 1)
  assert.is(!!get1.done, false)
  assert.is(get2.value, 1)
  assert.is(!!get2.done, false)
  assert.is(t.current.value, 1)

  get1 = it1.next()
  get2 = it2.next()

  assert.is(get1.value, 2)
  assert.is(!!get1.done, false)
  assert.is(get2.value, 2)
  assert.is(!!get2.done, false)
  assert.is(t.current.value, 2)
})

test('sync ending iterator', () => {
  const t = teme(
    (function * () {
      yield 17
    })()
  )
  assert.is(t.isSync, true, 'is a sync stream')

  const it1 = t[Symbol.iterator]()
  const it2 = t[Symbol.iterator]()

  let [get1, get2] = []

  get1 = it1.next()
  get2 = it2.next()

  assert.is(get1.value, 17)
  assert.is(!!get1.done, false)
  assert.is(get2.value, 17)
  assert.is(!!get2.done, false)
  assert.is(t.current.value, 17)

  get1 = it1.next()
  get2 = it2.next()

  assert.is(!!get1.done, true)
  assert.is(!!get2.done, true)
  assert.is(t.current.done, true)
})

test('sync error iterator', () => {
  let err
  const t = teme(
    (function * () {
      err = new Error('oops')
      throw err
    })()
  )

  const it = t[Symbol.iterator]()
  assert.throws(
    () => it.next(),
    e => e === err
  )

  const item = it.next()
  assert.is(item.done, true)
})

test.run()
