### 7.1.2

- fix: `json` now keeps the type information from the passed runtype

### 7.1.1

- fix: make `sloppyRecord` impure (closes [#60](https://github.com/hoeck/simple-runtypes/issues/60))

### 7.1.0

- add `json` runtype
- add `minLength` option to `string` runtype

### 7.0.0

- rename `nullable` to `nullOr` to be consistent with `undefinedOr`
  (because undefinable is not a good name)
- add `undefinedOr` that works like the old `optional` type
- real optional keys in `record`s:
  Change `optional` to be only usable in `record`.
  Using it will result in the key to be infered as optional:
  `record({key: optional(number())})` results in `{key?: number}` as the type
  (old behavior would infer `{key: undefined | number}`, you can get the old
  behaviour by using `undefinedOr` instead of `optional`)
- add `dictionary` and remove `numberIndex` and `stringIndex`
  Use `dictionary(stringAsInteger(), otherType)` to replace `numberIndex` and
  `dictionary(string(), otherType)` to replace `stringIndex`.

### 6.3.0

- add `partial` combinator runtype

### 6.2.0

- add `match` option to `string` to test the string against a regular expression

### 6.1.1

- fix and improve error value and path formatting (shout outs to @pabra for the patch)

### 6.1.0

- support intersection of unions and records

### 6.0.1

- fix: rename `useRuntype` to `use`

### 6.0.0

- change `useRuntype` to return a `ValidationResult` to support using runtypes
  without relying on exceptions and win in benchmarks
- rename `fail` to `createError`
- make `isFail` private, use `ValidationResult.ok` instead

### 5.0.2

- fix `fail` to not return `any` but `Fail`
  Now, custom runtypes will result in the correct inferred type of
  `Runtype<T>` instead of `Runtype<any>` for custom runtypes that might return
  a failure.

### 5.0.1

- fix missing error utility (`getFormattedError()`, ...) exports

### 5.0.0

- add `useRuntype` to call other runtypes in custom runtypes
- rename `enumValue` to `enum`
- remove `discriminatedUnion` - use the normal `union` instead.
  The discriminant `key` gets inferrred automatically by `union` now.

### 4.1.0

- fix error messages
- add `sloppyRecord` (props to @pabra)
- add `undefined` and `null` runtypes (props to @pabra)

### 4.0.1

- fix broken runtypes for `string` and `integer` due to missing return type annotations

### 4.0.0

- use copy-on-write for performance: they mostly just check their
  input object and return it unmodified.
  Before that, arrays and objects were always copied.
  Now, only if the runtype or any nested runtype modifies its input
  (e.g. trimming strings or custom runtypes), objects and arrays are copied.
- `stringIndex` and `numberIndex` now err on `"__proto__"` and `Symbol` keys

### 3.0.0

- add explicit options (min, max, length etc.) to `string`, `number`, `integer`, `stringAsInteger` and `array` runtypes
- change error messages
- improve `stringAsInteger` to accept `'-0'` and `'+123'` (leading plus) as valid integer strings

### 2.0.0

- remove `.check` and make user invocations of runtypes throw exceptions
  (using `.check` turned out to be a major annoyance and I forgot it in almost
  half of my code bc typescript does not warn me)
- add `runtype` to create custom runtypes
- add `RuntypeUsageError`, thrown when the api is misused
- add `getFormattedError`, `getFormattedErrorPath` and
  `getFormattedErrorValue` functions to extract information from
  `RuntypeError`

### 1.0.0

- add `.check` method throw a `RuntypeException`
- add `fail`, `isFail` to replace throwing `RuntypeException` on runtype errors
- add `union`, make intersection universal for all runtypes
- add `pick` and `omit` combinators
