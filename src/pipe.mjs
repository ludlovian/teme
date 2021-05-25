export default function Pipe () {
  let head = {}
  let tail = head
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
    else tail.next = Promise.resolve(item)
    tail = item
    if (tail.done) tail.next = Promise.resolve(tail)
  }

  async function next () {
    if (!head.next) {
      head.next = new Promise(resolve => {
        head.resolve = resolve
      })
    }
    head = await head.next
    return { value: head.value, done: head.done }
  }
}
