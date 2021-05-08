import { test } from 'uvu'
import * as assert from 'uvu/assert'

import group from '../src/group.mjs'

test('group', t => {
  const source = [
    [1, 10],
    [1, 11],
    [1, 12],
    [2, 20],
    [2, 21],
    [3, 30],
    [1, 19]
  ]

  const fn = x => ({ level: x[0] })
  const result = [...group(fn)(source)]
  assert.equal(result, [
    [
      { level: 1 },
      [
        [1, 10],
        [1, 11],
        [1, 12]
      ]
    ],
    [
      { level: 2 },
      [
        [2, 20],
        [2, 21]
      ]
    ],
    [{ level: 3 }, [[3, 30]]],
    [{ level: 1 }, [[1, 19]]]
  ])
})

test.run()
