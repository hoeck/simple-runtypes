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
    + [Discriminated Unions](#discriminated-unions)
  * [Reference](#reference)

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

A [[`Runtype`](src/index.ts#L187)](src/index.ts#L187) is a function that:

1. receives an unknown value
2. returns that value or a copy if all validations pass
3. throws a [[`RuntypeError`](src/index.ts#L27)](src/index.ts#L27) when validation fails

```typescript
interface Runtype<T> {
    (v: unknown) => T
}
```

Runtypes are constructed by calling factory functions.
For instance, [[`string`](src/index.ts#L450)](src/index.ts#L450) creates and retuns a string runtype.
Check the factory functions documentation for more details.

### Usage Examples

#### Strict Property Checks

When using [[`record`](src/index.ts#L896)](src/index.ts#L896), any properties which are not defined in the runtype will cause the runtype to fail:

```
const strict = st.record({name: st.string()})

strict({name: 'foo', other: 123})
// => RuntypeError: Unknown attribute 'other'
```

To ignore single properties, use [[`ignore`](src/index.ts#L552)](src/index.ts#L552), [[`unknown`](src/index.ts#L534)](src/index.ts#L534) or [[`any`](src/index.ts#L543)](src/index.ts#L543):

```
const strict = st.record({name: st.string(), other: st.ignore()})

strict({name: 'foo', other: 123})
// => {name: foo, other: undefined}
```

Use `sloppyRecord` to only validate known properties and remove everything else:

```
const sloppy = st.sloppyRecord({name: st.string()})

strict({name: 'foo', other: 123, bar: []})
// => {name: foo}
```

Using any of [[`record`](src/index.ts#L896)](src/index.ts#L896) or `sloppyRecord` will keep you safe from any `__proto__` injection or overriding attempts.

#### Optional Properties

Use the [[`optional`](src/index.ts#L976)](src/index.ts#L976) runtype to create [optional properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#optional-properties):

```
const squareConfigRuntype = st.record({
  color: st.optional(st.string()),
  width?: st.optional(st.number()),
})
```

#### Nesting

Collection runtypes such as [[`record`](src/index.ts#L896)](src/index.ts#L896), [[`array`](src/index.ts#L660)](src/index.ts#L660), [[`tuple`](src/index.ts#L733)](src/index.ts#L733) take runtypes as their parameters:

```
const nestedRuntype = st.record({
  name: st.string(),
  items: st.array(st.recorcd({ id: st.integer, label: st.string() })),
})

nestedRuntype({
  name: 'foo',
  items: [{ id: 3, label: 'bar' }],
}) // => returns the same data
```

#### Discriminated Unions

Simple-runtypes supports discriminated unions via [[`discriminatedUnion`](src/index.ts#L1091)](src/index.ts#L1091) runtype

The example found in the [Typescript Handbook](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions) translated to simple-runtypes:

```
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

const networdStateRuntype = st.discriminatedUnion(
  'state',
  networkLoadingState,
  networkFailedState,
  networkSuccessState,
)

type NetworkState = ReturnType<networkStateRuntype>
```

### Reference

Basic runtypes that match TS / Javascript types:

- [[`number`](src/index.ts#L262)](src/index.ts#L262)
- [[`string`](src/index.ts#L450)](src/index.ts#L450)
- [[`boolean`](src/index.ts#L430)](src/index.ts#L430)
- `null`
- `undefined`
- `enum`

Meta runtypes

- [[`integer`](src/index.ts#L311)](src/index.ts#L311)
- [[`stringAsInteger`](src/index.ts#L390)](src/index.ts#L390)
- [[`ignore`](src/index.ts#L552)](src/index.ts#L552)
- [[`unknown`](src/index.ts#L534)](src/index.ts#L534)
- [[`any`](src/index.ts#L543)](src/index.ts#L543)

Objects and Array Runtypes

- [[`tuple`](src/index.ts#L733)](src/index.ts#L733)
- [[`array`](src/index.ts#L660)](src/index.ts#L660)
- [[`record`](src/index.ts#L896)](src/index.ts#L896)
- `sloppyRecord`
- [[`numberIndex`](src/index.ts#L839)](src/index.ts#L839)
- [[`stringIndex`](src/index.ts#L788)](src/index.ts#L788)

Advanced Runtypes

- [[`literal`](src/index.ts#L487)](src/index.ts#L487)
- [[`optional`](src/index.ts#L976)](src/index.ts#L976)
- [[`nullable`](src/index.ts#L991)](src/index.ts#L991)
- [[`discriminatedUnion`](src/index.ts#L1091)](src/index.ts#L1091)
- [[`union`](src/index.ts#L1168)](src/index.ts#L1168)
- [[`intersection`](src/index.ts#L1252)](src/index.ts#L1252)
- [[`omit`](src/index.ts#L1291)](src/index.ts#L1291)
