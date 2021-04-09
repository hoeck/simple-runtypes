import { expectAcceptValuesImpure, objectAttributes, st } from './helpers'

describe('sloppyRecord', () => {
  it('accepts simple records', () => {
    const runtype = st.sloppyRecord({
      a: st.integer(),
      b: st.string(),
    })

    expectAcceptValuesImpure(runtype, [{ a: 0, b: 'foo' }])
  })

  it('accepts empty records', () => {
    const runType = st.sloppyRecord({})

    const value: {} = runType({})

    expect(value).toEqual({})
  })

  it('accepts records with optional values', () => {
    const runtype = st.sloppyRecord({
      a: st.integer(),
      b: st.optional(st.string()),
    })

    let value: { a: number; b?: string }

    value = runtype({ a: 0, b: 'foo' })
    expect(value).toEqual({ a: 0, b: 'foo' })

    value = runtype({ a: 0, b: undefined })
    expect(value).toEqual({ a: 0, b: undefined })
    expect(value).toEqual({ a: 0 })

    value = runtype({ a: 0 })
    expect(value).toEqual({ a: 0, b: undefined })
    expect(value).toEqual({ a: 0 })
  })

  it('accepts nested records', () => {
    const runtype = st.sloppyRecord({
      a: st.sloppyRecord({
        b: st.sloppyRecord({
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
    const runtype = st.sloppyRecord({
      a: st.sloppyRecord({
        b: st.sloppyRecord({
          c: st.string({ trim: true }), // returns a modified string
        }),
      }),
    })

    let value: { a: { b: { c: string } } }

    // eslint-disable-next-line prefer-const
    value = runtype({ a: { b: { c: '  foo  ' } } })

    expect(value).toEqual({ a: { b: { c: 'foo' } } })
  })

  it('returns records with known keys', () => {
    const runType = st.sloppyRecord({
      a: st.integer(),
      b: st.string(),
    })

    expect(runType({ a: 1, b: 'foo', c: 'not-in-record-definition' })).toEqual({
      a: 1,
      b: 'foo',
    })
  })

  it('ignores object attributes', () => {
    const runType = st.sloppyRecord({
      x: st.number(),
    })

    objectAttributes
      // JSON.parse bc the __proto__ attr cannot be assigned in js
      .map((a) => ({ a, o: JSON.parse(`{"x": 1, "${a}": {"y":2}}`) }))
      .forEach(({ a, o }) => {
        const x = runType(o)
        const y = runType(Object.assign({}, o))
        expect(x).not.toBe(o)
        expect(x).toEqual({ x: 1 })
        expect(y).toEqual({ x: 1 })
        expect((x as any).y).toBeUndefined()
        expect((y as any).y).toBeUndefined()
        expect(Object.prototype.hasOwnProperty.call(x, a)).toBeFalsy()
        expect(Object.prototype.hasOwnProperty.call(y, a)).toBeFalsy()
      })
  })
})
