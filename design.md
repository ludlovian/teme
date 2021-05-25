# Design approach

## Teme objects

Temes are very thin wrappers around iterables, in their sync form, or
asynIterables in their async form.

The relevant `next` function is stored as `._next` and used to get the
next item from the upstream source. The most recent item is also held as `._current`.

## Iterators

The stream of items created by the source is also linked as a linked list,
which each item having a `.next` pointing to the next one (or a Promise of it).

This allows different iterators on the source to move at their own speed and
act independently. Once all iterators on a stream have moved past an item,
then it is garbage collected. So there is no memory impact unless one
iterator hangs around, and fails to consume the data.

When an iterator (which is really just a pointer to an item on that list)
comes to the end of the data, it asks its parent teme to populate the next
item on the list by calling `_read` which returns the item, or a promise of it.

## Errors

If a teme object encounters an error in the upstream source during `_read`,
then the error is passed on - but the stream of data is ended by adding
a `{ done: true }` element onto the end whose `.next` points to itself.

## Pipe

The async pipe works in the same way. The data items are represented
as a singly-linked list with `.next` pointing to a promise of the next
item (or itself if it is the `done` marker).

But if the reader reaches the end of the data, it has no equivalent
`_read` function to call. Instead, it creates a promise for next item
as `.next` and puts the resolution function as `.resolve`.

When the writer comes to add a new data item, if it sees `.resolve`, then
it uses that to resolve the `.next` promise instead of adding `.next` itself.

