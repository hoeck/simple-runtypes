[![npm version](https://badge.fury.io/js/simple-runtypes.svg)](https://www.npmjs.com/package/simple-runtypes)
[![unit-tests](https://github.com/hoeck/simple-runtypes/workflows/unit-tests/badge.svg?branch=master)](https://github.com/hoeck/simple-runtypes/actions?query=workflow%3Aunit-tests+branch%3Amaster)
[![npm-publish](https://github.com/hoeck/simple-runtypes/workflows/npm-publish/badge.svg)](https://github.com/hoeck/simple-runtypes/actions?query=workflow%3Anpm-publish)

## Preface

I said I want **SIMPLE** runtypes.
Just functions that validate and return data.
Combine them into complex types and TypeScript knows their structure.
That's how runtypes work.

<!-- toc -->

- [Install](#install)
- [Example](#example)
- [Why?](#why)
- [Benchmarks](#benchmarks)
- [Documentation](#documentation)
  * [Intro](#intro)
  * [Usage Examples](#usage-examples)
    + [Strict Property Checks](#strict-property-checks)
    + [Optional Properties](#optional-properties)
    + [Nesting](#nesting)
    + [Discriminating Unions](#discriminating-unions)
    + [Custom Runtypes](#custom-runtypes)
  * [Reference](#reference)
  * [Roadmap / Todos](#roadmap--todos)

<!-- tocstop -->

## Install

`npm install simple-runtypes` or `yarn add simple-runtypes`

## Example

1. Define the Runtype:

```typescript
import * as st from 'simple-runtypes'

const userRuntype = st.record({
    id: st.integer(),
    name: st.string(),
    email: st.optional(st.string()),
})
```

now, `ReturnType<typeof userRuntype>` is equivalent to

```typescript
interface {
    id: number,
    name: string,
    email?: string
}
```

2. Use the runtype to validate untrusted data

```typescript
userRuntype({id: 1, name: 'matt'})
// => {id: 1, name: 'matt'}

userRuntype({id: 1, name: 'matt', isAdmin: true})
// throws an st.RuntypeError: "invalid field 'isAdmin' in data"
```

Invoke a runtype with [`use`](src/custom.ts#L51) to get a plain value back instead of throwing errors:

```typescript
st.use(userRuntype, {id: 1, name: 'matt'})
// => {ok: true, result: {id: 1, name: 'matt'}}

st.use(userRuntype, {id: 1, name: 'matt', isAdmin: true})
// => {ok: false, error: FAIL}

st.getFormattedError(FAIL)
// => 'invalid keys in record ["isAdmin"] at `<value>` in `{"id":1,"name": "matt", ... }`'
```

Not throwing errors is way more efficient and less obscure.
Throwing errors and catching them outside is more convenient.

## Why?

Why should I use this over the plethora of [other](https://github.com/moltar/typescript-runtime-type-benchmarks#packages-compared) runtype validation libraries available?

1. Strict: by default safe against proto injection attacks and unwanted properties
2. Fast: check the [benchmark](https://github.com/moltar/typescript-runtime-type-benchmarks)
3. Friendly: no use of `eval`, a small [footprint](https://bundlephobia.com/result?p=simple-runtypes) and no dependencies
4. Flexible: optionally modify the data while it's being checked: trim strings, convert numbers, parse dates

## Benchmarks

[@moltar](https://github.com/moltar) has done a great job comparing existing runtime type-checking libraries in [moltar/typescript-runtime-type-benchmarks](https://github.com/moltar/typescript-runtime-type-benchmarks).

[@pongo](https://github.com/pongo) has benchmarked [`simple-runtypes`](https://github.com/hoeck/simple-runtypes) against [`io-ts`](https://github.com/gcanti/io-ts) in [pongo/benchmark-simple-runtypes](https://github.com/pongo/benchmark-simple-runtypes).

## Documentation

### Intro

A [`Runtype`](src/runtype.ts#L106) is a function that:

1. receives an unknown value
2. returns that value or a copy if all validations pass
3. throws a [`RuntypeError`](src/runtype.ts#L7) when validation fails
   or returns [`ValidationResult`](src/custom.ts#L37) when passed to [`use`](src/custom.ts#L51)

```typescript
interface Runtype<T> {
    (v: unknown) => T
}
```

Runtypes are constructed by calling factory functions.
For instance, [`string`](src/string.ts#L28) creates and returns a string runtype.
Check the factory functions documentation for more details.

### Usage Examples

#### Strict Property Checks

When using [`record`](src/record.ts#L134), any properties which are not defined in the runtype will cause the runtype to fail:

```typescript
const strict = st.record({name: st.string()})

strict({name: 'foo', other: 123})
// => RuntypeError: Unknown attribute 'other'
```

To ignore single properties, use [`ignore`](src/ignore.ts#L6), [`unknown`](src/unknown.ts#L6) or [`any`](src/any.ts#L6):

```typescript
const strict = st.record({name: st.string(), other: st.ignore()})

strict({name: 'foo', other: 123})
// => {name: foo, other: undefined}
```

Use [`sloppyRecord`](src/record.ts#L159) to only validate known properties and remove everything else:

```typescript
const sloppy = st.sloppyRecord({name: st.string()})

sloppy({name: 'foo', other: 123, bar: []})
// => {name: foo}
```

Using any of [`record`](src/record.ts#L134) or [`sloppyRecord`](src/record.ts#L159) will keep you safe from any `__proto__` injection or overriding attempts.

#### Optional Properties

Use the [`optional`](src/optional.ts#L18) runtype to create [optional properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#optional-properties):

```typescript
const squareConfigRuntype = st.record({
  color: st.optional(st.string()),
  width?: st.optional(st.number()),
})
```

#### Nesting

Collection runtypes such as [`record`](src/record.ts#L134), [`array`](src/array.ts#L28), [`tuple`](src/tuple.ts#L42) take runtypes as their parameters:

```typescript
const nestedRuntype = st.record({
  name: st.string(),
  items: st.array(st.record({ id: st.integer, label: st.string() })),
})

nestedRuntype({
  name: 'foo',
  items: [{ id: 3, label: 'bar' }],
}) // => returns the same data
```

#### Discriminating Unions

`simple-runtypes` supports [Discriminating Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions) via the [`union`](src/union.ts#L143) runtype.

The example found in the [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions) translated to `simple-runtypes`:

```typescript
const networkLoadingState = st.record({
  state: st.literal('loading'),
})

const networkFailedState = st.record({
  state: st.literal('failed'),
  code: st.number(),
})

const networkSuccessState = st.record({
  state: st.literal('success'),
  response: st.record({
    title: st.string(),
    duration: st.number(),
    summary: st.string(),
  })
})

const networdStateRuntype = st.union(
  networkLoadingState,
  networkFailedState,
  networkSuccessState,
)

type NetworkState = ReturnType<typeof networkStateRuntype>
```

Finding the runtype to validate a specific discriminating union with is done efficiently with a [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map).

#### Custom Runtypes

Write your own runtypes as plain functions, e.g. if you want to turn a string into a `BigInt`:

```typescript
const bigIntStringRuntype = st.string({match: /^-?[0-9]+n$/})

const bigIntRuntype = st.runtype((v) => {
    const stringCheck = st.use(bigIntStringRuntype, v)

    if (!stringCheck.ok) {
        return stringCheck.error
    }

    return BigInt(stringCheck.result.slice(0, -1))
})

bigIntRuntype("123n") // => 123n
bigIntRuntype("2.2") // => error: "expected string to match ..."
```

### Reference

Basic runtypes that match JavaScript/TypeScript types:

- [`number`](src/number.ts#L13)
- [`string`](src/string.ts#L28)
- [`boolean`](src/boolean.ts#L14)
- [`null`](src/null.ts#6)
- [`undefined`](src/undefined.ts#7)
- [`enum`](src/enum.ts#9)
- [`literal`](src/literal.ts#L10)

Meta runtypes:

- [`integer`](src/integer.ts#L26)
- [`stringAsInteger`](src/stringAsInteger.ts#L62)
- [`ignore`](src/ignore.ts#L6)
- [`unknown`](src/unknown.ts#L6)
- [`any`](src/any.ts#L6)
- [`json`](src/json.ts#L27)

Objects and Array Runtypes:

- [`tuple`](src/tuple.ts#L42)
- [`array`](src/array.ts#L28)
- [`record`](src/record.ts#L134)
  - [`optional`](src/optional.ts#L18)
- [`sloppyRecord`](src/record.ts#L159)
- [`dictionary`](src/dictionary.ts#L87)

Combinators:

- [`union`](src/union.ts#L143)
- [`intersection`](src/intersection.ts#L110)
- [`omit`](src/omit.ts#L8)
- [`pick`](src/pick.ts#L7)
- [`partial`](src/partial.ts#L10)
- TODO: `get` - similar to Type[key]

Shortcuts:

- [`nullOr`](src/nullOr.ts#L11)
- [`undefinedOr`](src/undefinedOr.ts#L11)

### Roadmap / Todos

- `size` - a meta-runtype that imposes a size limit on types, maybe via convert-to-json and .length on the value passed to it
- rename [`stringLiteralUnion`](src/stringLiteralUnion.ts#L6) to `literals` or `literalUnion` and make it work
  on all types that [`literal`](src/literal.ts#L10) accepts
- rename [`sloppyRecord`](src/record.ts#L159) to `record.sloppy` because I need
  the "sloppy"-concept for other runtypes too: e.g. `nullable.sloppy` - a
  `Runtype<T | null>` that also accepts `undefined` which is useful to slowly
  add new nullable fields to existing json database records
- improve docs:
  - *preface*: what is a runtype and why is it useful
  - *why*: explain or link to example that shows "strict by default"
  - show that `simple-runtypes` is feature complete because it can
    1. express all TypeScript types
    2. is extendable with custom runtypes (add documentation)
  - add small frontend and backend example projects that show how to use `simple-runtypes` in production
- test types with [tsd](https://github.com/SamVerschueren/tsd)
- add missing combinators: partial, required
- add other combinators like partial, required, ...
