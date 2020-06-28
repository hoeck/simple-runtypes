### 2.0.0

- remove `.check` and make user invocations of runtypes throw exceptions
  (using `.check` turned out to be a major annoyance and I forgot it in almost
  half of my code bc typescript does not warn me)
- add `RuntimeUsageError`, thrown when the api is misused

### 1.0.0

- add `.check` method throw a `RuntypeException`
- add `fail`, `isFail` to replace throwing `RuntypeException` on runtype errors
- add `union`, make intersection universal for all runtypes
- add `pick` and `omit` combinators
