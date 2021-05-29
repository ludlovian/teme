import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

test('async scan', async () => {
  const update = async ({ number: n }, v) => ({ number: n + v * 10 })

  const t1 = teme([1, 2, 3]).toAsync()
  const t2 = t1.scan(update, { number: 0 })
  const result = await t2.collect()
  assert.equal(result, [{ number: 10 }, { number: 30 }, { number: 60 }])
})

test.run()
