import { test } from 'uvu'
import * as assert from 'uvu/assert'

import sleep from 'pixutil/sleep'

import Pipe from '../src/pipe.mjs'

test('basic write & read', async t => {
  const p = new Pipe()
  await p.write('foo')
  await p.write('bar')
  await p.end()

  let item
  item = await p.next()
  assert.equal(item.value, 'foo')
  item = await p.next()
  assert.equal(item.value, 'bar')
  item = await p.next()
  assert.equal(item.done, true)
})

test('async write', async t => {
  const p = new Pipe()
  const written = (async () => {
    await sleep(100)
    await p.write('foo')
    await sleep(100)
    await p.write('bar')
  })()

  // first value
  let { done, value } = await p.next()
  assert.is(value, 'foo')
  assert.not.ok(done)
  // second
  ;({ done, value } = await p.next())
  assert.is(value, 'bar')
  assert.not.ok(done)
  // done
  await written
  p.end()
  ;({ done, value } = await p.next())
  assert.ok(done)
})

test('write after close', async () => {
  const p = new Pipe()
  let item

  p.write('foo')
  p.end()

  item = await p.next()
  assert.is(item.value, 'foo')

  p.write('bar')

  item = await p.next()
  assert.is(item.done, true)

  p.write('bar')

  item = await p.next()
  assert.is(item.done, true)
})

test.run()
