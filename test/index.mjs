import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../src/index.mjs'

test('sync construction', () => {
  const t = teme([1, 2, 3])
  assert.is(t.isSync, true, 'reports as sync')
  assert.is(t.isAsync, false, 'does not report as async')
  assert.is(t[Symbol.iterator](), t, 'is an iterable')
  assert.not.ok(t[Symbol.asyncIterator], 'is not an asyncIterable')
  assert.type(t.next, 'function', 'is an iterator')

  assert.is(teme(t), t, 'wrapping returns the original')

  assert.equal([...t], [1, 2, 3], 'yields the source')
})

test('async construction', async () => {
  async function * gen () {
    yield 1
    yield 2
    yield 3
  }

  const t = teme(gen())
  assert.is(t.isAsync, true, 'reports as async')
  assert.is(t.isSync, false, 'does not report as sync')
  assert.is(t[Symbol.asyncIterator](), t, 'is an asyncIterable')
  assert.not.ok(t[Symbol.iterator], 'is not an iterable')
  assert.type(t.next, 'function', 'is an iterator')

  assert.is(teme(t), t, 'wrapping returns the original')

  const arr = []
  for await (const v of t) arr.push(v)

  assert.equal(arr, [1, 2, 3], 'yields the source')
})

test('pass existing teme', () => {
  const t1 = teme([1, 2, 3])
  const t2 = teme(t1)
  assert.is(t2, t1, 'original is passed back')
})

test('pass non-iterable', () => {
  assert.throws(() => teme({}))
})

test('async on async', async () => {
  const g = (async function * () {
    yield * [1, 2, 3]
  })()
  const t1 = teme(g)
  assert.is(t1.isAsync, true)

  const t2 = t1.toAsync()
  assert.is(t2.isAsync, true)
})

test('async on sync', async () => {
  const t1 = teme([1, 2, 3])
  assert.is(t1.isAsync, false)

  const t2 = t1.toAsync()
  assert.is(t2.isAsync, true)
  assert.not.ok(t2[Symbol.iterator])
  assert.ok(t2[Symbol.asyncIterator])

  const arr = []
  for await (const v of t2) arr.push(v)

  assert.equal(arr, [1, 2, 3], 'yields the source')
})

test.run()
