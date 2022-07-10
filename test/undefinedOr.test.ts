import { expectAcceptValuesPure, expectRejectValues, st } from './helpers'

describe('undefinedOr', () => {
  it('accepts undefined or T', () => {
    expectAcceptValuesPure(st.undefinedOr(st.string()), [undefined, 'foo', ''])
  })

  it('deals with impure runtypes', () => {
    const rt = st.undefinedOr(st.string({ trim: true }))

    expect(rt).not.toHaveProperty('isPure')

    expect(rt(undefined)).toEqual(undefined)
    expect(rt('')).toEqual('')
    expect(rt('foo ')).toEqual('foo')
  })

  it('rejects non-undefined and non-T', () => {
    expectRejectValues(
      st.undefinedOr(st.string()),
      [{}, [], null, 123, false, true],
      'expected a string',
    )
  })
})
