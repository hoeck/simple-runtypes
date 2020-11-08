import { expectAcceptValuesPure, expectRejectValues, st } from './helpers'

describe('undefined', () => {
  it('accepts undefined', () => {
    expectAcceptValuesPure(st.undefined(), [undefined])
  })

  it('rejects non-undefined', () => {
    expectRejectValues(
      st.undefined(),
      ['123', '', {}, [], null, 123],
      'expected undefined',
    )
  })
})
