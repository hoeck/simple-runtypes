import {
  expectAcceptValuesImpure,
  expectAcceptValuesPure,
  expectRejectValues,
  st,
} from './helpers'

describe('nullOr', () => {
  it('accepts null or T', () => {
    expectAcceptValuesPure(st.nullOr(st.string()), [null, 'foo', ''])
  })

  it('deals with impure runtypes', () => {
    const rt = st.nullOr(st.string({ trim: true }))

    expectAcceptValuesImpure(
      rt,
      [
        [' ', ''],
        ['foo ', 'foo'],
      ],
      true,
    )

    // we need to test unmodified primitive values directly because the
    // test helper assumes that the runtype result will not be identical
    // to the original value
    expect(rt(null)).toEqual(null)
  })

  it('rejects non-null and non-T', () => {
    expectRejectValues(
      st.nullOr(st.string()),
      [{}, [], undefined, 123, false, true],
      'expected a string',
    )
  })
})
