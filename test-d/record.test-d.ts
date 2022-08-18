import { expectError, expectType } from 'tsd'
import * as st from '../src'

const data: unknown = null

// plain record
{
  const rt = st.record({
    a: st.number(),
    b: st.string(),
  })

  expectType<{ a: number; b: string }>(rt(data))
}

// record with optionals
{
  const rt = st.record({
    a: st.number(),
    b: st.optional(st.string()),
  })

  expectType<{ a: number; b?: string }>(rt(data))
}

// nested record
{
  const rt = st.record({
    a: st.record({
      b: st.record({
        c: st.string(),
      }),
    }),
  })

  expectType<{ a: { b: { c: string } } }>(rt(data))
}

// record with json
{
  const rt = st.record({
    a: st.string(),
    b: st.json(
      st.record({
        c: st.string(),
      }),
    ),
    d: st.string(),
  })

  expectType<{ a: string; b: { c: string }; d: string }>(rt(data))
}
