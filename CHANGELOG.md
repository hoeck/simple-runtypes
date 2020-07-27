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
