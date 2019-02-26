import test from 'ava'
import teme from '../src/'

function isResolved (prom, timeout = 10) {
  return new Promise(resolve => {
    setTimeout(() => resolve(false), timeout)
    prom.then(() => resolve(true))
  })
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

test('create a stream', t => {
  const s = teme()
  t.is(typeof s, 'function')
  t.is(s(), undefined)

  s('foo')
  t.is(s(), 'foo')
})

test('create dependent', t => {
  const s1 = teme()
  const s2 = s1.map(x => x * 2, 5)
  t.is(s2(), 5)

  s1(10)
  t.is(s2(), 20)

  s1(15)
  t.is(s2(), 30)
})

test('end the parent', t => {
  const s1 = teme()
  const s2 = s1.map(x => x * 2)
  s1(10)
  t.is(s2(), 20)
  t.falsy(s1.end())
  t.falsy(s2.end())

  s1.end(true)

  t.is(s1.end(), true)
  t.is(s2.end(), true)

  s1(15)

  t.is(s2(), 20)
})

test('end the child', t => {
  const s1 = teme()
  const s2 = s1.map(x => x * 2)
  s1(10)
  t.is(s2(), 20)
  t.falsy(s1.end())
  t.falsy(s2.end())

  s2.end(true)
  t.falsy(s1.end())
  t.is(s2.end(), true)

  s1(15)
  t.is(s2(), 20)
})

test('dependent that sometimes updates', t => {
  let count = 0
  const s1 = teme()
  const s2 = teme.combine((s, self) => {
    t.is(s, s1)
    t.is(self, s2)
    if (count++ % 2 === 0) return s() * 2
  }, [s1])

  s1(2) // count = 0
  t.is(s2(), 4)

  s1(3) // count = 1
  t.is(s2(), 4)

  s1(3) // count = 2
  t.is(s2(), 6)
})

test('merging streams', t => {
  let count = 0
  const s1 = teme()
  const s2 = teme()
  const s3 = teme.merge(s1, s2)
  s3.map(v => {
    count++
    t.is(v, count * 10)
  })

  t.plan(4)
  s1(10)
  s2(20)
  s1(30)
  s2(40)
})

test('scan stream', t => {
  const s1 = teme()
  const s2 = s1.scan((accum, val) => accum + 2 * val, 10)

  t.is(s2(), 10)

  s1(3)
  t.is(s2(), 16)

  s1(-6)
  t.is(s2(), 4)
})

test('dedupe', t => {
  let count = 0
  const s1 = teme()
  const s2 = s1.dedupe()
  s2.map(() => count++)

  t.is(count, 0)

  s1('foo')
  t.is(count, 1)
  t.is(s2(), 'foo')

  s1('foo')
  t.is(count, 1)
  t.is(s2(), 'foo')

  s1('bar')
  t.is(count, 2)
  t.is(s2(), 'bar')
})

test('when, starting resolved', async t => {
  let p
  const s1 = teme(2)
  const s2 = s1.when(v => v % 2 === 0)

  p = s2()
  t.true(p instanceof Promise)
  t.true(await isResolved(p))

  s1(4)
  t.is(s2(), p)

  s1(5)
  t.not(s2(), p)
  p = s2()
  t.false(await isResolved(p))

  s1(7)
  t.is(s2(), p)
  t.false(await isResolved(p))

  s1(8)
  t.is(s2(), p)
  t.true(await isResolved(p))
})

test('when, starting unresolved', async t => {
  let p
  const s1 = teme(3)
  const s2 = s1.when(v => v % 2 === 0)

  p = s2()
  t.true(p instanceof Promise)
  t.false(await isResolved(p))

  s1(4)
  t.is(s2(), p)
  t.true(await isResolved(p))
})

test('throttle', async t => {
  const s1 = teme()
  const s2 = s1.throttle(10)

  // first call passed through
  s1(1)
  t.is(s2(), 1)

  // second is not yet
  s1(2)
  t.not(s2(), s1())

  await delay(15)
  // passed through
  t.is(s2(), s1())

  // next is also delayed
  s1(3)
  t.not(s2(), s1())

  await delay(10)
  t.is(s2(), s1())

  // full period of no activity, resets
  await delay(10)
  s1(4)
  // so passed through on leading edge again
  t.is(s2(), s1())
})

test('changed', async t => {
  const s1 = teme()
  const p = s1.changed()
  t.true(p instanceof Promise)
  t.false(await isResolved(p))

  s1(10)
  t.true(await isResolved(p))
})

test('debounce', async t => {
  const s1 = teme()
  const s2 = s1.debounce(10)

  // first update, not passed through
  s1(1)
  t.not(s2(), s1())

  await delay(15)
  t.is(s2(), s1())

  // first update of several
  s1(2)
  t.is(s2(), 1)

  // each time, no update is passed through as there has not
  // been 10ms of quiet
  await delay(5)
  t.is(s2(), 1)
  s1(3)
  t.is(s2(), 1)

  await delay(5)
  t.is(s2(), 1)
  s1(4)
  t.is(s2(), 1)

  await delay(5)
  t.is(s2(), 1)
  s1(5)
  t.is(s2(), 1)

  await delay(5)
  t.is(s2(), 1)
  s1(6)
  t.is(s2(), 1)

  // finally, 10ms of quiet, so the last update is passed through
  await delay(15)
  t.is(s2(), 6)
})
