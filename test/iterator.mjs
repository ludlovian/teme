import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../src/index.mjs'

test('async iterator', async () => {
  async function * f () {
    yield 'foo'
    yield 'bar'
    yield 'baz'
  }

  const t = teme(f())
  assert.is(t.isAsync, true, 'is an async stream')

  const it = t[Symbol.asyncIterator]()
  let item = await it.next()
  assert.is(item.value, 'foo')
  assert.is(!!item.done, false)
  assert.is(t.current.value, 'foo')
  assert.is(!!t.current.done, false)

  item = await it.next()
  assert.is(item.value, 'bar')
  assert.is(!!item.done, false)

  item = await it.next()
  assert.is(item.value, 'baz')
  assert.is(!!item.done, false)

  item = await it.next()
  assert.is(!!item.done, true)
  assert.is(!!t.current.done, true)
})

test('multiple async iterators', async () => {
  let item
  const t = teme([10, 20, 30, 40]).toAsync()

  const it1 = t[Symbol.asyncIterator]()
  item = await it1.next()
  assert.is(item.value, 10)

  const it2 = t[Symbol.asyncIterator]()

  item = await it1.next()
  assert.is(item.value, 20)
  item = await it1.next()
  assert.is(item.value, 30)
  assert.is(t.current.value, 30)

  item = await it2.next()
  assert.is(item.value, 20)
  item = await it2.next()
  assert.is(item.value, 30)
  item = await it2.next()
  assert.is(item.value, 40)
  assert.is(t.current.value, 40)
})

test('sync iterator', () => {
  function * f () {
    yield 'foo'
    yield 'bar'
    yield 'baz'
  }

  const t = teme(f())
  assert.is(t.isSync, true, 'is an async stream')

  const it = t[Symbol.iterator]()
  let item = it.next()
  assert.is(item.value, 'foo')
  assert.is(!!item.done, false)

  item = it.next()
  assert.is(item.value, 'bar')
  assert.is(!!item.done, false)

  item = it.next()
  assert.is(item.value, 'baz')
  assert.is(!!item.done, false)

  item = it.next()
  assert.is(!!item.done, true)
})

test('multiple sync iterators', () => {
  let item
  const t = teme([10, 20, 30, 40])

  const it1 = t[Symbol.iterator]()
  item = it1.next()
  assert.is(item.value, 10)

  const it2 = t[Symbol.iterator]()

  item = it1.next()
  assert.is(item.value, 20)
  item = it1.next()
  assert.is(item.value, 30)

  item = it2.next()
  assert.is(item.value, 20)
  item = it2.next()
  assert.is(item.value, 30)
  item = it2.next()
  assert.is(item.value, 40)
})

test.run()
