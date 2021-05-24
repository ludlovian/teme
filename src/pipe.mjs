export default function Pipe () {
  let curr = {}
  let tail = curr
  return { write, end, next }

  function write (value) {
    _write({ value })
  }

  function end () {
    _write({ done: true })
  }

  function _write (item) {
    if (tail.done) return
    if (tail.resolve) tail.resolve(item)
    tail.next = Promise.resolve(item)
    tail = item
    if (tail.done) tail.next = Promise.resolve(tail)
  }

  async function next () {
    if (!curr.next) {
      curr.next = new Promise(resolve => {
        curr.resolve = resolve
      })
    }
    curr = await curr.next
    const { value, done } = curr
    return { value, done }
  }
}
