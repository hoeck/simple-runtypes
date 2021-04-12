import {
  expectAcceptValuesImpure,
  expectAcceptValuesPure,
  expectRejectValues,
  st,
} from './helpers'

describe('dictionary', () => {
  // old stringIndex
  it('accepts string keyed objects', () => {
    const runtype = st.dictionary(st.string(), st.number())

    expectAcceptValuesPure(runtype, [{ a: 1, b: 2 }, { a: 1 }, { 1: 1 }, {}])
  })

  it('returns a new object if the runtype is impure', () => {
    const runtype = st.dictionary(st.string(), st.string({ trim: true }))

    expectAcceptValuesImpure(runtype, [{}])
  })

  it('rejects non-string keyed objects', () => {
    const runtype = st.dictionary(st.string(), st.number())

    expectRejectValues(runtype, [
      undefined,
      null,
      0,
      '',
      false,
      'asd',
      [1, 2, 3],
      { 1: null },
      JSON.parse('{ "__proto__": { "a": "foo" } }'),
      { [Symbol()]: 10 },
      {
        foo() {
          return 1
        },
      },
    ])
  })

  // old numberIndex
  it('accepts "string as integer" keyed objects', () => {
    const runtype = st.dictionary(st.stringAsInteger(), st.number())

    expectAcceptValuesImpure(runtype, [{ 1: 100 }, { 100: 22, '101': 25 }, {}])
  })

  it('returns a new object when using an impure runtype', () => {
    const runtype = st.dictionary(
      st.stringAsInteger(),
      st.string({ trim: true }),
    )

    expectAcceptValuesImpure(runtype, [{}])
  })

  it('rejects non-number keyed objects', () => {
    const runtype = st.dictionary(st.stringAsInteger(), st.number())

    expectRejectValues(runtype, [
      undefined,
      null,
      0,
      '',
      false,
      'asd',
      [1, 2, 3],
      { 1: null },
      { [Symbol()]: 10 },
      JSON.parse('{ "__proto__": { "123": 2 } }'),
      {
        foo() {
          return 1
        },
      },
    ])
  })

  it('accepts custom key runtype', () => {
    const runtype = st.dictionary(
      st.union(st.literal('A'), st.literal('B'), st.string({ match: /^_/ })),
      st.string(),
    )

    expectAcceptValuesPure(runtype, [
      { A: '1', B: 'two' },
      { _a: 'one', B: 'three' },
      {},
    ])
  })

  it('rejects custom key runtype', () => {
    const runtype = st.dictionary(
      st.union(st.literal('A'), st.literal('B'), st.string({ match: /^_/ })),
      st.string(),
    )

    expectRejectValues(runtype, [
      { a: '1', b: 'two' },
      { A_: 'one' },
      { B: 2 },
      { _c: true },
      JSON.parse('{ "__proto__":  "123" }'),
    ])
  })
})
