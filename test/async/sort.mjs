import { test } from 'uvu'
import * as assert from 'uvu/assert'

import teme from '../../src/index.mjs'

const DATA = [{ name: 'foo' }, { name: 'bar' }, { name: 'quux' }]

const SORTED = [{ name: 'bar' }, { name: 'foo' }, { name: 'quux' }]

const sortFn = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)

test('async sort', async () => {
  const t1 = teme(DATA).toAsync()
  const t2 = t1.sort(sortFn)
  assert.equal(await t2.collect(), SORTED)
})

test.run()
