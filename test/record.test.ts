import {
  expectAcceptValuesImpure,
  expectAcceptValuesPure,
  expectRejectValues,
  objectAttributes,
  st,
} from './helpers'

describe('record', () => {
  it('accepts simple records', () => {
    const runtype = st.record({
      a: st.integer(),
      b: st.string(),
    })

    expectAcceptValuesPure(runtype, [{ a: 0, b: 'foo' }])
  })

  it('returns a new object when nested runtypes are impure', () => {
    const runtype = st.record({
      a: st.integer(),
      b: st.string({ trim: true }),
    })

    expectAcceptValuesImpure(runtype, [{ a: 0, b: 'foo' }])
  })

  it('accepts empty records', () => {
    const runType = st.record({})

    const value = runType({})

    expect(value).toEqual({})
  })

  it('accepts records with optional values', () => {
    const runtype = st.record({
      a: st.integer(),
      b: st.optional(st.string()),
    })

    expectAcceptValuesPure(runtype, [
      { a: 0, b: 'foo' },
      { a: 0, b: undefined },
      { a: 0 },
    ])

    expectRejectValues(runtype, [
      { b: 'foo' },
      { b: undefined },
      {},
      { a: undefined },
      undefined,
      null,
      0,
    ])
  })

  it('keeps optional attributes of impure records', () => {
    const runtype = st.record({ a: st.optional(st.string({ trim: true })) })

    expectAcceptValuesImpure(
      runtype,
      [
        [{}, {}],
        [{ a: '' }, { a: '' }],
        [{ a: ' a ' }, { a: 'a' }],
        [{ a: undefined }, { a: undefined }],
      ],
      true,
    )
  })

  it('accepts nested records', () => {
    const runtype = st.record({
      a: st.record({
        b: st.record({
          c: st.string(),
        }),
      }),
    })

    let value: { a: { b: { c: string } } }

    // eslint-disable-next-line prefer-const
    value = runtype({ a: { b: { c: 'foo' } } })
    expect(value).toEqual({ a: { b: { c: 'foo' } } })
  })

  it('returns runtypes values', () => {
    const runtype = st.record({
      a: st.record({
        b: st.record({
          c: st.string({ trim: true }), // returns a modified string
        }),
      }),
    })

    let value: { a: { b: { c: string } } }

    // eslint-disable-next-line prefer-const
    value = runtype({ a: { b: { c: '  foo  ' } } })

    expect(value).toEqual({ a: { b: { c: 'foo' } } })
  })

  it('rejects records with non-mapped keys', () => {
    const runType = st.record({
      a: st.integer(),
      b: st.string(),
    })
    expect(() =>
      runType({ a: 1, b: 'foo', c: 'not-in-record-definition' }),
    ).toThrow('invalid keys in record: ["c"]')

    const nestedRunType = st.record({
      a: st.integer(),
      d: st.record({
        e: st.string(),
      }),
    })
    expect(() =>
      nestedRunType({ a: 1, d: { e: 'foo', f: 'not-in-record-definition' } }),
    ).toThrow('invalid keys in record: ["f"]')
  })

  it('rejects records with object attributes', () => {
    const runType = st.record({
      x: st.number(),
    })

    expectRejectValues(
      runType,
      // JSON.parse bc the __proto__ attr cannot be assigned in js
      objectAttributes.map((a) => JSON.parse(`{"x": 1, "${a}": "x"}`)),
    )
  })

  it('rejects records with missing keys', () => {
    const runType = st.record({
      a: st.integer(),
      b: st.string(),
    })

    expect(() => runType({ b: 'foo' })).toThrow('missing key in record: "a"')
  })
})
