import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

test('async filter', async () => {
  const t1 = teme(
    (async function * () {
      yield * [1, 2, 3, 4]
    })()
  )
  const t2 = t1.filter(v => Promise.resolve(v % 2 === 0))
  const result = []
  for await (const v of t2) result.push(v)
  assert.equal(result, [2, 4])
})

test.run()
