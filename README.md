# teme
Teeny-tiny stream library

>In valleys of springs of rivers,\
>By Ony and Teme and Clun,\
>The country for easy livers,\
>The quietest under the sun
>
>*A.E. Housman - A Shropshire Lad*

## Purpose
I wrote this primarily to understand streams (and related Observables), and for my own use.
It is not intended for production use.

## Credits
Inspired by the excellent flyd library at https://github.com/paldepind/flyd, which I recommend if you want a stream library


## API

### teme

`s = teme(initialValue)`

creates a stream with an initial value. This will be an `insteanceof` teme as well
as `instanceof Function`.

To get/set:

```
s(x) // set
x = s() // get
```

Streams have an `.end` property - also a form of stream. Updating this `end` stream
disconnects a stream from any parents, children and subscriptions.

### subscribe

`s.subscribe(fn)`

The function `fn` will be called on every subsequent update of the stream.

Subscribe returns a function which can be called to unsubscribe

### teme.combine

`s = teme.combine(fn, streams, opts)`

Returns a new stream which is dependent on the list `streams` of parents.

Its value will be calculated using the given function `fn`, which has the signature

`fn (parent1, parent2, ....., parentN, self, changed)`

where `changed` is an array of the parents which have changed causing this update
and `self` is the dependent stream itself (so it can update itself if it wishes)

If `fn` returns something other than null/undefined, then the dependent stream
will be updated with that.

The options object can have:
- `skip` if set, the function will not be called initially
- `initial` the initial value, if `skip` is set

All derived streams are built using this, but mostly you will use one of the
shortcuts

### map

`s2 = s1.map(fn, opts)`

creates a stream which is calculated by running the udpated value through
a function.

Options are the same as `teme.combine`

### clone

`s2 = s1.clone()`

A version of `map` using the identity function

### merge

```
s4 = s1.merge(s2, s3,...)
s4 - teme.merge(s1, s2, s3,...)
```

Creates a stream which has the union of updates of its parent streams

### scan

`s2 = s1.scan(fn, initialAccum)`

Creates a stream whose value is updated by calling  the reducer `fn` with signature
`fn(accum, update) -> newAccum`

### dedupe

`s2 = s1.dedupe([fn], [opts])`

Creates a stream which ignores duplicate updates. Duplication is tested by the
given compare `fn`, defaulting to  `a === b`

Options:
- `skip` if set, the stream will not be primed with the current value

### when

`s2 = s1.when(fn)`

Creates a stream of `Promise`s which resolve when then parent stream matches
the given matching function `fn`. E.g.

```
s1 = stream({ loaded: false })
startLoading(s1)
s2 = s1.when(x => x.loaded)
await s2()
assert(s1().loaded)
```

### changed

`await s.changed()`

Returns a single `Promise` which resolves on the next update of the stream.

### throttle

`s2 = s1.throttle(period)`

Returns a throttled version of the stream, which updates at most once per `period`

### debounce

`s2 = s1.debounce(period)`

Returns a debounced version of the stream, which updated after a quiet `period`

### teme.fromPromise

`s = teme.fromPromise(p)`

Creates a stream which will update with the result once resolved, or
the reason if rejected.

If it rejects with a something other than `Error`, then it will be wrapped
in an `Error` with `.promise` and `.reason` set
