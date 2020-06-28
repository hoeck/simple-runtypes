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
