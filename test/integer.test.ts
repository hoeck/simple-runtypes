import { expectAcceptValuesPure, expectRejectValues, st } from './helpers'

describe('integer', () => {
  it('accepts integers', () => {
    expectAcceptValuesPure(st.integer(), [
      1,
      2,
      -23,
      0,
      123456789,
      Number.MAX_SAFE_INTEGER,
      -Number.MAX_SAFE_INTEGER,
    ])
  })

  it('accepts / rejects integers with restrictions', () => {
    expectAcceptValuesPure(st.integer({ min: 11 }), [11, 1234])
    expectRejectValues(
      st.integer({ min: 11 }),
      [10, 0],
      'expected the integer to be >= 11',
    )

    expectAcceptValuesPure(st.integer({ max: -12 }), [-12, -100])
    expectRejectValues(
      st.integer({ max: -12 }),
      [-11, 1],
      'expected the integer to be <=',
    )

    expectAcceptValuesPure(st.integer({ min: 0, max: 2 }), [0, 1, 2])
    expectRejectValues(st.integer({ min: 0, max: 2 }), [
      -1,
      1.2,
      NaN,
      3,
      200,
      'xx',
      undefined,
      Infinity,
    ])
  })

  it('rejects non-integers', () => {
    expectRejectValues(
      st.integer(),
      [
        NaN,
        1.1,
        0.0001,
        Infinity,
        '123',
        [],
        undefined,
        null,
        { a: 1 },
        Number.MAX_SAFE_INTEGER + 1,
        Number.MIN_SAFE_INTEGER - 1,
      ],
      'expected a safe integer',
    )
  })
})
