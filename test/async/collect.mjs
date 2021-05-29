import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

test('async collect', async () => {
  async function * gen () {
    yield * [1, 2, 3]
  }
  const t1 = teme(gen())
  const result = await t1.collect()
  assert.equal(result, [1, 2, 3])
})

test.run()
