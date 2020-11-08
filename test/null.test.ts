import { expectAcceptValuesPure, expectRejectValues, st } from './helpers'

describe('null', () => {
  it('accepts null', () => {
    expectAcceptValuesPure(st.null(), [null])
  })

  it('rejects non-null', () => {
    expectRejectValues(
      st.null(),
      ['123', '', {}, [], undefined, 123],
      'expected null',
    )
  })
})
