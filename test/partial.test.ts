import { expectAcceptValuesPure, expectRejectValues, st } from './helpers'

describe('partial', () => {
  const record = st.record({
    a: st.number(),
    b: st.optional(st.string()),
    c: st.boolean(),
  })

  const partialRt = st.partial(record)

  it('turn all fields into optionals', () => {
    const acceptedValues = [
      // complete record
      { a: 2, b: 'foo', c: true },

      // partials
      {},
      { a: 2 },
      { b: 'foo' },
      { c: true },
      { a: 3, b: 'foo' },
      { a: undefined, b: 'foo' },
      { a: undefined, b: 'foo', c: undefined },
      { a: undefined, b: undefined, c: undefined },
    ]

    expectAcceptValuesPure(partialRt, acceptedValues)
  })

  it('should reject ', () => {
    const rejectedValues = [
      // reject nulls
      { a: null, b: 'foo', c: true },

      // reject additional keys
      { a: 2, b: 'foo', c: true, x: 100 },
      { x: 100 },

      // reject invalid types
      { a: true, b: 'foo', c: true },

      // reject complete garbage
      'foo',
      NaN,
      123,
      null,
      undefined,
    ]

    expectRejectValues(partialRt, rejectedValues)
  })
})
