export default function (fn) {
  return function * map (src) {
    for (const item of src) {
      yield fn(item)
    }
  }
}
