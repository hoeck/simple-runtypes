import { expectAcceptValuesPure, expectRejectValues, st } from './helpers'

describe('guardedBy', () => {
  const guard = (v: unknown): v is string => typeof v === 'string'
  const runtype = st.guardedBy(guard)

  it('accepts valid values', () => {
    expectAcceptValuesPure(runtype, ['a', 'aa', ''])
  })

  it('rejects invalid values', () => {
    expectRejectValues(runtype, [null, undefined, 0, [], {}])
  })
})
