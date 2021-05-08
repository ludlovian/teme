export default function (fn) {
  return function * each (src) {
    for (const item of src) {
      fn(item)
      yield item
    }
  }
}
