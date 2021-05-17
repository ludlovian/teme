import { test } from 'uvu'
import * as assert from 'uvu/assert'

import Pipe from 'pipe'
import teme from '../src/index.mjs'

test('basic write & read', async () => {
  const [r1, w1] = new Pipe()
  const [r2, w2] = new Pipe()
  const t = teme.join(r1, r2)
  const it = t[Symbol.asyncIterator]()

  await w1.write('foo')
  const get1 = await read(it)
  assert.equal(get1, { value: 'foo', index: 0 })

  await w1.write('bar')
  const get2 = await read(it)
  assert.equal(get2, { value: 'bar', index: 0 })

  await w2.write('baz')
  const get3 = await read(it)
  assert.equal(get3, { value: 'baz', index: 1 })
})

test('closing one', async () => {
  const [r1, w1] = new Pipe()
  const [r2, w2] = new Pipe()
  const t = teme.join(r1, r2)
  const it = t[Symbol.asyncIterator]()

  await w1.write('foo')
  const get1 = await read(it)
  assert.equal(get1, { value: 'foo', index: 0 })

  await w1.close()
  await w2.write('bar')
  const get2 = await read(it)
  assert.equal(get2, { value: 'bar', index: 1 })
})

test('closing all', async () => {
  const [r1, w1] = new Pipe()
  const [r2, w2] = new Pipe()
  const t = teme.join(r1, r2)
  const it = t[Symbol.asyncIterator]()

  await w1.write('foo')
  const get1 = await read(it)
  assert.equal(get1, { value: 'foo', index: 0 })

  await w1.close()
  await w2.close()

  const { done } = await it.next()
  assert.is(done, true)
})

test('multi-way join', async () => {
  const [r1] = new Pipe()
  const [r2] = new Pipe()
  const [r3, w3] = new Pipe()
  const t = teme.join(r1, r2, r3)
  const it = t[Symbol.asyncIterator]()

  await w3.write('foo')
  const get = await read(it)
  assert.equal(get, { value: 'foo', index: 2 })
})

test('error', async () => {
  const err = new Error('oops')
  const [r1, w1] = new Pipe()
  const [r2, w2] = new Pipe()
  const t = teme.join(r1, r2)
  const it = t[Symbol.asyncIterator]()

  await w2.throw(err)
  await it
    .next()
    .then(assert.unreachable)
    .catch(error => {
      assert.is(error, err)
      assert.is(error.index, 1)
    })

  await w1.write('will be lost')
  const { done } = await it.next()
  assert.is(done, true)
})

test('empty join', async () => {
  const t = teme.join()
  const r = await t.collect()
  assert.equal(r, [])
})

async function read (it) {
  const { value: item, done } = await it.next()
  if (done) return { done }
  const [value, index] = item
  return { value, index }
}

test.run()
