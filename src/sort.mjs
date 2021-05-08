export default function sort (fn) {
  return function * (source) {
    const data = [...source]
    yield * data.sort(fn)
  }
}
