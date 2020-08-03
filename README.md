[![npm version](https://badge.fury.io/js/simple-runtypes.svg)](https://www.npmjs.com/package/simple-runtypes)
[![unit-tests](https://github.com/hoeck/simple-runtypes/workflows/unit-tests/badge.svg?branch=master)](https://github.com/hoeck/simple-runtypes/actions?query=workflow%3Aunit-tests+branch%3Amaster)
[![npm-publish](https://github.com/hoeck/simple-runtypes/workflows/npm-publish/badge.svg?branch=master)](https://github.com/hoeck/simple-runtypes/actions?query=workflow%3Anpm-publish+branch%3Amaster)

## Preface

I said I want **SIMPLE** runtypes.
Just functions that validate and return data.
Combine them into complex types and Typescript knows their structure.
Thats how runtypes work.

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
    email?:string
}
```

2. Use the runtype to validate untrusted data

```typescript
userRuntype({id: 1, name: 'matt'})
// => {id: 1, name: 'matt'}

userRuntype({id: 1, name: 'matt', isAdmin: true})
// throws a st.RuntypeError 'invalid field 'isAdmin' in data
```
