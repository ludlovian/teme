export default function batch (size) {
  return function * (source) {
    let batch = []
    for (const item of source) {
      batch.push(item)
      if (batch.length === size) {
        yield batch
        batch = []
      }
    }
    if (batch.length) yield batch
  }
}
