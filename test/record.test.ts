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

    const value: {} = runType({})

    expect(value).toEqual({})
  })

  it('accepts records with optional values', () => {
    const runtype = st.record({
      a: st.integer(),
      b: st.optional(st.string()),
    })

    let value: { a: number; b?: string }

    value = runtype({ a: 0, b: 'foo' })
    expect(value).toEqual({ a: 0, b: 'foo' })

    value = runtype({ a: 0, b: undefined })
    expect(value).toEqual({ a: 0, b: undefined })
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
    ).toThrow('invalid keys in record')
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
