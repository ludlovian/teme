import equal from 'pixutil/equal'

export default function group (fn) {
  return function * (src) {
    let prev = Symbol('null')
    let group = []
    for (const item of src) {
      const curr = fn(item)
      if (!equal(curr, prev)) {
        if (group.length) yield [prev, group]
        group = []
        prev = curr
      }
      group.push(item)
    }
    if (group.length) yield [prev, group]
  }
}
