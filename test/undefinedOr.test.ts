import {
  expectAcceptValuesImpure,
  expectAcceptValuesPure,
  expectRejectValues,
  st,
} from './helpers'

describe('undefinedOr', () => {
  it('accepts undefined or T', () => {
    expectAcceptValuesPure(st.undefinedOr(st.string()), [undefined, 'foo', ''])
  })

  it('deals with impure runtypes', () => {
    const rt = st.undefinedOr(st.string({ trim: true }))

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
    expect(rt(undefined)).toEqual(undefined)
  })

  it('rejects non-undefined and non-T', () => {
    expectRejectValues(
      st.undefinedOr(st.string()),
      [{}, [], null, 123, false, true],
      'expected a string',
    )
  })
})
