export default function (fn) {
  return function * filter (src) {
    for (const item of src) {
      if (fn(item)) yield item
    }
  }
}
