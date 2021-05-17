# Teme

A *teme* is a stream of data. Like the River Teme.

>In valleys of springs of rivers,\
>By Onny and Teme and Clun,\
>The country for easy livers,\
>The quietest under the sun
>
>*A.E. Housman - A Shropshire Lad*

## Teme objects

A Teme object can be either *synchronous* or *asynchronous*
and is implemented as an object following the iterable and iterator protocols -
or the asyncIterable and asyncIterator protocols.


## API

### teme

You create a teme by wrapping an existing iterable (or async version) in `teme`

```
import teme from 'teme'

const t = teme(iterable)
```

They can then be converted, filtered & processed by the various methods. Once a stream
has been so converted, you should no longer use it. If you want a separate copy, then
use `tee` to get one.

### teme.isTeme

Function used to test if something is a Teme object

### teme.join
`newStream = join(stream0, stream1, ...)`

Creates a stream which is the union of the supplied streams.

The joined stream provides values of the form `[value, index]` where `index` tells you which of the source streams provided this value.

If any of the sources error then the joined stream will also reject with that error, which will have an `index` property on it.


## Teme Methods & attributes

### .isSync & .isAsync => Boolean

Tells you whether the teme is a sync-mode or async-mode stream.

`for ... of` only works with sync mode objects, whilst `for await ... of` works with either.

### .toAsync() => Teme

Converts a stream into an async one, if it wasn't already.

### .map(fn) => Teme

Like the array method, this applies a function to each value in the stream, yielding the result.

### .filter(fn) => Teme

This lets through values only where `fn(value)` is truthy.

### .collect() => Array

This collects the values of a finite stream in an array, and returns it.

If the teme `isAsync` then you get a promise of an array (obviously!).

### .sort(sortFn) => Teme

This sorts a finite array based on the supplied function (as `sort`) and yields the values back out in order.

### .each(fn) => Teme

The supplied function is called for each value, but the values are unchanged

### .scan((accum, value) => accum, initialValue) => Teme

Accumulates stream values as a reducer would.

### .group(keyFn) => Teme

Uses the supplied key function to calculate a key for each value.

The resulting stream yields `[key, group]` on each change of key, where `group` is a stream of consecutive values with the same key.

### .batch(size) => Teme

Batches the stream into separate streams of the given size or smaller.

The result stream yields streams. 

### .dedupe(fn) => Teme

Skips items if they are duplicates. Duplicates are determined by calling `fn(previous, current)`.

If the function is omitted, then `pixutil/equal` is used to look for deep equality.

### .consume()

Consumes a stream, like piping to `/dev/null`. Used for the side effects in the stream, and to dispose of it.

### .tee(copy => {...}) => Teme
(Async only)

Copies a stream. The copy is provided to the function given.

Implemented by using `pipe`, so this will block eventually if you do not consume the data in the copy.
