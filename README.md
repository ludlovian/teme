# teme
Library of handy generator base stream utils

Terminology
- A *stream* is an iterable.
- A *transform* is a function that takes a *stream* and returns another.

Available as separate exports or named exports from the default

## batch
`batch(size)`

A transform stream that batches up items in arrays of the given size (or smaller).

## group
`group(fn)`

A transform that groups consecutive items together with the same key.

The function `fn` is used to extract the key from the item. Keys will then be compared
for deep equality (using `pixutil`)

The transformed stream yields out `[key, [item,...]]` items.

## filter
`filter(fn)`

Creates a transform that filters items.

## map
`map(fn)`

Creates a transform that applies a function like `Array.map`

## pipeline
`pipeline(xform1, xform2, ...)`

Chains a line of transforms together

## sort
`sort(sortfn)`

creates a transform that sorts a stream using the standard `array.sort` function.

Obviously has to slurp up the whole stream in order to sort it.
