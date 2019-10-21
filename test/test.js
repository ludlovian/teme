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

test('subscribe', t => {
  const s = teme()
  let last
  const unsub = s.subscribe(x => {
    last = x
  })

  s(1)
  t.is(last, 1)

  s(2)
  t.is(last, 2)

  unsub()
  s(3)
  t.is(last, 2)
})

test('create dependent', t => {
  const s1 = teme()
  const s2 = s1.map(x => x * 2, { skip: true, initial: 5 })
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
  const s2 = teme.combine(
    (s, self) => {
      t.is(s, s1)
      t.is(self, s2)
      if (count++ % 2 === 0) return s() * 2
    },
    [s1],
    { skip: true }
  )

  s1(2) // count = 0
  t.is(s2(), 4)

  s1(3) // count = 1
  t.is(s2(), 4)

  s1(3) // count = 2
  t.is(s2(), 6)
})

test('diamond dependency', t => {
  // S1 -> S2 -> S3
  //  \           \
  //   +---------> S4
  //
  // When S1 upates, S4, should only update once,
  // with both S1 nd S3 in changed
  //
  // S5 -> S6 is an unrelated chain updated as part of S4.
  //
  const s1 = teme()
  const s2 = s1.clone()
  const s3 = s2.clone()
  let count = 0
  const s4 = teme.combine(
    (s1, s3, s4, changed) => {
      t.is(count, 0)
      count++
      t.is(changed.length, 2)
      t.true(changed.indexOf(s1) !== -1)
      t.true(changed.indexOf(s3) !== -1)
      s5(3 * s1())
      return s1() + s3()
    },
    [s1, s3],
    { skip: true }
  )
  const s5 = teme()
  const s6 = s5.clone()

  s1(1)
  t.is(s4(), 2)
  t.is(s6(), 3)
  t.is(count, 1)
})

test('clone a stream', t => {
  const s1 = teme()
  const s2 = s1.clone()
  s1(1)
  t.is(s2(), 1)

  s1(2)
  t.is(s2(), 2)
})

test('merging streams', t => {
  let count = 0
  const s1 = teme()
  const s2 = teme()
  const s3 = s1.merge(s2)
  s3.map(
    v => {
      count++
      t.is(v, count * 10)
    },
    { skip: true }
  )

  t.plan(4)
  s1(10)
  s2(20)
  s1(30)
  s2(40)
})

test('fromPromise', async t => {
  let _resolve
  let _reject
  let p = new Promise(resolve => {
    _resolve = resolve
  })

  let s = teme.fromPromise(p)
  t.falsy(s())
  _resolve('foo')
  await s.changed()
  t.is(s(), 'foo')

  p = new Promise((resolve, reject) => {
    _reject = reject
  })
  s = teme.fromPromise(p)
  t.falsy(s())

  let e = new Error('oops')
  _reject(e)
  await s.changed()
  t.is(s(), e)

  p = new Promise((resolve, reject) => {
    _reject = reject
  })
  s = teme.fromPromise(p)
  t.falsy(s())
  _reject('bar')
  await s.changed()
  e = s()
  t.true(e instanceof Error)
  t.is(e.promise, p)
  t.is(e.reason, 'bar')
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
  const s1 = teme('foo')
  const s2 = s1.dedupe()
  s2.map(() => count++, { skip: true })

  t.is(s2(), 'foo')
  t.is(count, 0)

  s1('foo')
  t.is(count, 0)

  s1('bar')
  t.is(count, 1)
  t.is(s2(), 'bar')
})

test('dedupe, with options', t => {
  const s1 = teme('foo')
  const s2 = s1.dedupe({ skip: true })
  t.is(s2(), undefined)
  s1('foo')
  t.is(s2(), 'foo')
})

test('dedupe, with compare function', t => {
  const s1 = teme('foo')
  const s2 = s1.dedupe((a, b) => typeof a === typeof b)
  t.is(s2(), 'foo')
  s1('bar')
  t.is(s2(), 'foo')
  s1(17)
  t.is(s2(), 17)
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
  const s1 = teme(3)
  const s2 = s1.when(v => v % 2 === 0)

  const p = s2()
  t.true(p instanceof Promise)
  t.false(await isResolved(p))

  s1(4)
  t.is(s2(), p)
  t.true(await isResolved(p))
})

test('throttle', async t => {
  const s1 = teme()
  const s2 = s1.throttle(100)

  // first call passed through
  s1(1)
  t.is(s2(), 1)

  // second is not yet
  s1(2)
  t.not(s2(), s1())

  await delay(150)
  // passed through
  t.is(s2(), s1())

  // next is also delayed
  s1(3)
  t.not(s2(), s1())

  await delay(100)
  t.is(s2(), s1())

  // full period of no activity, resets
  await delay(100)
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
  const s2 = s1.debounce(100)

  // first update, not passed through
  s1(1)
  t.not(s2(), s1())

  await delay(150)
  t.is(s2(), s1())

  // first update of several
  s1(2)
  t.is(s2(), 1)

  // each time, no update is passed through as there has not
  // been 100ms of quiet
  await delay(50)
  t.is(s2(), 1)
  s1(3)
  t.is(s2(), 1)

  await delay(50)
  t.is(s2(), 1)
  s1(4)
  t.is(s2(), 1)

  await delay(50)
  t.is(s2(), 1)
  s1(5)
  t.is(s2(), 1)

  await delay(50)
  t.is(s2(), 1)
  s1(6)
  t.is(s2(), 1)

  // finally, 100ms of quiet, so the last update is passed through
  await delay(150)
  t.is(s2(), 6)
})
