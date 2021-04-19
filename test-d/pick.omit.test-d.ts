import { expectError, expectType } from 'tsd'
import * as st from '../src'
import { Collapse } from '../src/runtype'

const data: unknown = null

// basic
{
  const rt = st.record({
    a: st.number(),
    b: st.string(),
    c: st.nullable(st.string()),
  })

  // pick
  expectType<{ b: string }>(st.pick(rt, 'b')(data))
  expectType<{ a: number; b: string }>(st.pick(rt, 'a', 'b')(data))

  // omit
  expectType<{ b: string; c: string | null }>(st.omit(rt, 'a')(data))
  expectType<{ c: string | null }>(st.omit(rt, 'a', 'b')(data))
  expectType<{}>(st.omit(rt, 'a', 'b', 'c')(data))
}

// with optionals
{
  const rt = st.record({
    a: st.number(),
    b: st.optional(st.string()),
    c: st.optional(st.nullable(st.string())),
  })

  // pick
  expectType<{ a: number }>(st.pick(rt, 'a')(data))
  expectType<{ b?: string }>(st.pick(rt, 'b')(data))
  expectType<{ a: number; b?: string }>(st.pick(rt, 'b', 'a')(data))
  expectType<{ b?: string; c?: string | null }>(st.pick(rt, 'c', 'b')(data))

  // omit
  expectType<{ b?: string; c?: string | null }>(st.omit(rt, 'a')(data))
  expectType<{ c?: string | null }>(st.omit(rt, 'a', 'b')(data))
  expectType<{ a: number }>(st.omit(rt, 'b', 'c')(data))
}
