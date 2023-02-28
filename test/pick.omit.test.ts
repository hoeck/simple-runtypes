import {
  expectAcceptValuesImpure,
  expectAcceptValuesPure,
  expectRejectValues,
  st,
} from './helpers'

describe('pick & omit', () => {
  const record = st.record({
    a: st.number(),
    b: st.optional(st.string()),
    c: st.boolean(),
  })

  const pickedRt = st.pick(record, 'a', 'b')
  const omittedRt = st.omit(record, 'c')

  it('should select some fields', () => {
    const acceptedValues = [
      { a: 1 },
      { a: 2, b: undefined },
      { a: 3, b: 'abc' },
    ]

    expectAcceptValuesPure(pickedRt, acceptedValues)
    expectAcceptValuesPure(omittedRt, acceptedValues)
  })

  it('should reject omitted/non-picked fields', () => {
    const rejectedValues = [
      { c: true, a: 1 },
      { c: false, a: 2, b: undefined },
      { c: false, a: 3, b: 'abc' },
      { a: 'string', b: 'abc' },
      { a: 1, b: 123 },
      {},
      123,
      null,
      undefined,
    ]

    expectRejectValues(pickedRt, rejectedValues)
    expectRejectValues(omittedRt, rejectedValues)
  })

  it('should preserve nonStrict', () => {
    const nonStrictRecordRuntype = st.nonStrict(
      st.record({ a: st.string(), b: st.string(), c: st.string() }),
    )

    const pickedRuntype = st.pick(nonStrictRecordRuntype, 'a', 'b')
    const omittedRuntype = st.omit(nonStrictRecordRuntype, 'a', 'b')

    expectAcceptValuesImpure(
      pickedRuntype,
      [
        [
          { a: 'a', b: 'b', c: 'c', d: 'd' },
          { a: 'a', b: 'b' },
        ],
      ],
      true,
    )
    expectAcceptValuesImpure(
      omittedRuntype,
      [[{ a: 'a', b: 'b', c: 'c', d: 'd' }, { c: 'c' }]],
      true,
    )
  })
})

describe('error messages', () => {
  const runtypeA = st.record({
    a: st.string(),
    b: st.array(
      st.record({
        point: st.tuple(st.number(), st.number()),
      }),
    ),
  })

  it('should report the full path to an invalid value', () => {
    try {
      runtypeA({ a: 'foo', b: [{ point: [12, 13] }, { point: [12, null] }] })
    } catch (e) {
      expect(st.getFormattedErrorPath(e)).toEqual('b[1].point[1]')
      expect(st.getFormattedError(e)).toEqual(
        'RuntypeError: expected a number at `<value>.b[1].point[1]` for `null`',
      )
    }
  })
})
