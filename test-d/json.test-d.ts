import { expectType } from 'tsd'
import * as st from '../src'

const data: unknown = null

// basic
{
  // number
  const jsonNumberRt = st.json(st.number())

  expectType<number>(jsonNumberRt(data))

  // string
  const jsonStringRt = st.json(st.string())

  expectType<string>(jsonStringRt(data))

  // array
  const jsonArrayRt = st.json(st.array(st.number()))

  expectType<number[]>(jsonArrayRt(data))

  // object
  const jsonObjectRt = st.json(st.record({ a: st.string() }))

  expectType<{ a: string }>(jsonObjectRt(data))
}
