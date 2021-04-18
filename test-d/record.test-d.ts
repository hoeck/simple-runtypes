import { expectError, expectType } from 'tsd'
import * as st from '../src'

{
  const data: unknown = null
  const rt = st.record({
    a: st.number(),
    b: st.string(),
  })

  expectType<{ a: number; b: string }>(rt(data))
}
