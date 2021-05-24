import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../src/index.mjs'

test('basic write & read', async () => {
  const t1 = teme.pipe()
  const t2 = teme.pipe()
  const t3 = teme.join(t1, t2)
  const it = t3[Symbol.asyncIterator]()

  t1.write('foo')
  const get1 = await read(it)
  assert.equal(get1, { value: 'foo', index: 0 })

  t1.write('bar')
  const get2 = await read(it)
  assert.equal(get2, { value: 'bar', index: 0 })

  t2.write('baz')
  const get3 = await read(it)
  assert.equal(get3, { value: 'baz', index: 1 })
})

test('closing one', async () => {
  const t1 = teme.pipe()
  const t2 = teme.pipe()
  const t3 = teme.join(t1, t2)
  const it = t3[Symbol.asyncIterator]()

  t1.write('foo')
  const get1 = await read(it)
  assert.equal(get1, { value: 'foo', index: 0 })

  t1.end()
  t2.write('bar')
  const get2 = await read(it)
  assert.equal(get2, { value: 'bar', index: 1 })
})

test('closing all', async () => {
  const t1 = teme.pipe()
  const t2 = teme.pipe()
  const t3 = teme.join(t1, t2)
  const it = t3[Symbol.asyncIterator]()

  t1.write('foo')
  const get1 = await read(it)
  assert.equal(get1, { value: 'foo', index: 0 })

  t1.end()
  t2.end()

  const { done } = await it.next()
  assert.is(done, true)
})

test('multi-way join', async () => {
  const t1 = teme.pipe()
  const t2 = teme.pipe()
  const t3 = teme.pipe()
  const t4 = teme.join(t1, t2, t3)
  const it = t4[Symbol.asyncIterator]()

  t3.write('foo')
  const get = await read(it)
  assert.equal(get, { value: 'foo', index: 2 })
})

test('error', async () => {
  const err = new Error('oops')
  const t1 = teme.pipe()
  const t2 = teme.pipe()
  t2._next = async () => Promise.reject(err)

  const t3 = teme.join(t1, t2)
  const it = t3[Symbol.asyncIterator]()

  await it
    .next()
    .then(assert.unreachable)
    .catch(error => {
      assert.is(error, err)
      assert.is(error.index, 1)
    })

  t1.write('will be lost')
  const { done } = await it.next()
  assert.is(done, true)
})

test('empty join', async () => {
  const t = teme.join()
  const r = await t.collect()
  assert.equal(r, [])
})

test('sync join', async () => {
  const t1 = teme(['foo', 'bar'])
  const t2 = teme([10, 20])
  const t3 = teme.join(t1, t2)
  const res = await t3.collect()
  assert.equal(res, [
    ['foo', 0],
    ['bar', 0],
    [10, 1],
    [20, 1]
  ])
})

async function read (it) {
  const { value: item, done } = await it.next()
  if (done) return { done }
  const [value, index] = item
  return { value, index }
}

test.run()
