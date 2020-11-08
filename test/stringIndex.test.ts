import {
  expectAcceptValuesImpure,
  expectAcceptValuesPure,
  expectRejectValues,
  st,
} from './helpers'

describe('stringIndex', () => {
  it('accepts string keyed objects', () => {
    const runtype = st.stringIndex(st.number())

    expectAcceptValuesPure(runtype, [{ a: 1, b: 2 }, { a: 1 }, { 1: 1 }, {}])
  })

  it('returns a new object if the runtype is impure', () => {
    const runtype = st.stringIndex(st.string({ trim: true }))

    expectAcceptValuesImpure(runtype, [{}])
  })

  it('rejects non-string keyed objects', () => {
    const runtype = st.stringIndex(st.number())

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
})
