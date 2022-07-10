import { expectAcceptValuesPure, expectRejectValues, st } from './helpers'

describe('nullOr', () => {
  it('accepts null or T', () => {
    expectAcceptValuesPure(st.nullOr(st.string()), [null, 'foo', ''])
  })

  it('deals with impure runtypes', () => {
    const rt = st.nullOr(st.string({ trim: true }))

    expect(rt).not.toHaveProperty('isPure')

    expect(rt(null)).toEqual(null)
    expect(rt('')).toEqual('')
    expect(rt('foo ')).toEqual('foo')
  })

  it('rejects non-null and non-T', () => {
    expectRejectValues(
      st.nullOr(st.string()),
      [{}, [], undefined, 123, false, true],
      'expected a string',
    )
  })
})
