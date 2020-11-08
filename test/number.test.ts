import { expectAcceptValuesPure, expectRejectValues, st } from './helpers'

describe('number', () => {
  it('accepts numbers', () => {
    expectAcceptValuesPure(st.number(), [123, 0, -0, 123e56])
  })

  it('rejects non-numbers', () => {
    expectRejectValues(
      st.number(),
      ['123', '', {}, [], null, undefined],
      'expected a number',
    )
    expectRejectValues(st.number(), [NaN], 'expected a number that is not NaN')
    expectRejectValues(
      st.number(),
      [Infinity, -Infinity],
      'expected a finite number',
    )
  })

  it('optionally allows NaN', () => {
    const rt = st.number({ allowNaN: true })

    expectAcceptValuesPure(rt, [123, 0, -0, 1.2, NaN])
    expectRejectValues(
      rt,
      ['asd', undefined, null, Infinity, -Infinity],
      'expected',
    )
  })

  it('optionally allows Infinite numbers', () => {
    const rt = st.number({ allowInfinity: true })

    expectAcceptValuesPure(rt, [123, 0, -0, 1.123, Infinity, -Infinity])
    expectRejectValues(rt, ['asd', undefined, null, NaN], 'expected ')
  })

  it('optionally rejects numbers smaller than x', () => {
    const rt = st.number({ min: 3.14 })

    expectAcceptValuesPure(rt, [123, 3.14])
    expectRejectValues(rt, [0, -1, 3.139], 'expected number to be >= 3.14')
    expectRejectValues(
      rt,
      ['asd', undefined, null, , -Infinity, Infinity, NaN], // eslint-disable-line no-sparse-arrays
      'expected ',
    )
  })

  it('optionally rejects numbers larger than x', () => {
    const rt = st.number({ max: -2.3 })

    expectAcceptValuesPure(rt, [-2.301, -2.3, -100, -2.3e32])
    expectRejectValues(rt, [-2.299, -1, 3000], 'expected number to be <= -2.3')
    expectRejectValues(
      rt,
      ['asd', undefined, null, +Infinity, NaN],
      'expected ',
    )
  })

  it('combines all options', () => {
    const rt = st.number({ max: 5, allowNaN: true, allowInfinity: true })

    expectAcceptValuesPure(rt, [0, -1, 5.0, -Infinity, NaN])
    expectRejectValues(
      rt,
      [[+Infinity, [], '123', undefined, null]],
      'expected ',
    )
  })
})
