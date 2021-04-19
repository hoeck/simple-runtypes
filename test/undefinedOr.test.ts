import { expectAcceptValuesPure, expectRejectValues, st } from './helpers'

describe('undefinedOr', () => {
  it('accepts undefined or T', () => {
    expectAcceptValuesPure(st.undefinedOr(st.string()), [undefined, 'foo', ''])
  })

  it('deals with impure runtypes', () => {
    expectAcceptValuesPure(st.undefinedOr(st.string({ trim: true })), [
      undefined,
      'foo',
      '',
    ])
  })

  it('rejects non-undefined and non-T', () => {
    expectRejectValues(
      st.undefinedOr(st.string()),
      [{}, [], null, 123, false, true],
      'expected a string',
    )
  })
})
