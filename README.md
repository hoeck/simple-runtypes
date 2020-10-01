[![npm version](https://badge.fury.io/js/simple-runtypes.svg)](https://www.npmjs.com/package/simple-runtypes)
[![unit-tests](https://github.com/hoeck/simple-runtypes/workflows/unit-tests/badge.svg?branch=master)](https://github.com/hoeck/simple-runtypes/actions?query=workflow%3Aunit-tests+branch%3Amaster)
[![npm-publish](https://github.com/hoeck/simple-runtypes/workflows/npm-publish/badge.svg?branch=master)](https://github.com/hoeck/simple-runtypes/actions?query=workflow%3Anpm-publish+branch%3Amaster)

## Preface

I said I want **SIMPLE** runtypes.
Just functions that validate and return data.
Combine them into complex types and Typescript knows their structure.
Thats how runtypes work.

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
// throws a st.RuntypeError 'invalid field 'isAdmin' in data
```

## Why?

Why should I use this over the plethora of [other](https://github.com/moltar/typescript-runtime-type-benchmarks#packages-compared) runtype validation libraries available?

1. Written in and for Typescript
2. Strict by default
3. Supports efficient discriminated unions
4. Frontend-friendly (no `eval`, small [footprint](https://bundlephobia.com/result?p=simple-runtypes), no dependencies)
6. Fast (of all non-eval based libs, only one is faster according to the [benchmark](https://github.com/moltar/typescript-runtime-type-benchmarks))

## Benchmarks

[@moltar](https://github.com/moltar) has done a great job comparing existing runtime typechecking libraries in [moltar/typescript-runtime-type-benchmarks](https://github.com/moltar/typescript-runtime-type-benchmarks)

## Documentation

### Intro

A [`Runtype`](src/runtype.ts#L79) is a function that:

1. receives an unknown value
2. returns that value or a copy if all validations pass
3. throws a [`RuntypeError`](src/runtypeError.ts#L30) when validation fails

```typescript
interface Runtype<T> {
    (v: unknown) => T
}
```

Runtypes are constructed by calling factory functions.
For instance, [`string`](src/string.ts#L26) creates and retuns a string runtype.
Check the factory functions documentation for more details.

### Usage Examples

#### Strict Property Checks

When using [`record`](src/record.ts#L91), any properties which are not defined in the runtype will cause the runtype to fail:

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

Use [`sloppyRecord`](src/record.ts#L97) to only validate known properties and remove everything else:

```typescript
const sloppy = st.sloppyRecord({name: st.string()})

strict({name: 'foo', other: 123, bar: []})
// => {name: foo}
```

Using any of [`record`](src/record.ts#L91) or [`sloppyRecord`](src/record.ts#L97) will keep you safe from any `__proto__` injection or overriding attempts.

#### Optional Properties

Use the [`optional`](src/optional.ts#L11) runtype to create [optional properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#optional-properties):

```typescript
const squareConfigRuntype = st.record({
  color: st.optional(st.string()),
  width?: st.optional(st.number()),
})
```

#### Nesting

Collection runtypes such as [`record`](src/record.ts#L91), [`array`](src/array.ts#L28), [`tuple`](src/tuple.ts#L42) take runtypes as their parameters:

```typescript
const nestedRuntype = st.record({
  name: st.string(),
  items: st.array(st.recorcd({ id: st.integer, label: st.string() })),
})

nestedRuntype({
  name: 'foo',
  items: [{ id: 3, label: 'bar' }],
}) // => returns the same data
```

#### Discriminating Unions

Simple-runtypes supports [Discriminating Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions) via the [`union`](src/union.ts#L137) runtype.

The example found in the [Typescript Handbook](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions) translated to simple-runtypes:

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

type NetworkState = ReturnType<networkStateRuntype>
```

Finding the runtype to validate a specific discriminating union with is done efficiently with a [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map).

### Reference

Basic runtypes that match TS / Javascript types:

- [`number`](src/number.ts#L13)
- [`string`](src/string.ts#L26)
- [`boolean`](src/boolean.ts#L14)
- [`null`](src/null.ts#6)
- [`undefined`](src/undefined.ts#7)
- [`enum`](src/enum.ts#9)

Meta runtypes

- [`integer`](src/integer.ts#L26)
- [`stringAsInteger`](src/stringAsInteger.ts#L62)
- [`ignore`](src/ignore.ts#L6)
- [`unknown`](src/unknown.ts#L6)
- [`any`](src/any.ts#L6)

Objects and Array Runtypes

- [`tuple`](src/tuple.ts#L42)
- [`array`](src/array.ts#L28)
- [`record`](src/record.ts#L91)
- [`sloppyRecord`](src/record.ts#L97)
- [`numberIndex`](src/numberIndex.ts#L18)
- [`stringIndex`](src/stringIndex.ts#L17)

Advanced Runtypes

- [`literal`](src/literal.ts#L10)
- [`optional`](src/optional.ts#L11)
- [`nullable`](src/nullable.ts#L11)
- [`union`](src/union.ts#L137)
- [`intersection`](src/intersection.ts#L72)
- [`omit`](src/omit.ts#L9)

### Roadmap / Todos

- rename [`sloppyRecord`](src/record.ts#L97) to `record.sloppy` because I need
  the `sloppy`-concept for other runtypes too: e.g. `nullable.sloppy` - a
  `Runtype<T | null>` that also accepts `undefined` which is useful to slowly
  add new nullable fields to existing json database records
- improve docs:
  - *preface*: what is a runtype and why is it useful
  - *why*: explain or link to example that shows "strict by default" and "efficient discriminating unions"
  - show that simple-runtypes is feature complete because it can
    1. express all typescript types
    2. is extendable with custom runtypes (add documentation)
  - add small frontend and backend example projects that show how to use simple-runtypes in production
- test types with [tsd](https://github.com/SamVerschueren/tsd)
- add missing combinators: partial, required
- add other combinators like partial, required, ...
