import {
  expectAcceptValuesImpure,
  expectAcceptValuesPure,
  expectRejectValues,
  st,
} from './helpers'

describe('numberIndex', () => {
  it('accepts string keyed objects', () => {
    const runtype = st.numberIndex(st.number())

    expectAcceptValuesPure(runtype, [{ 1: 100 }, { 100: 22, 101: 25 }, {}])
  })

  it('returns a new object when using an impure runtype', () => {
    const runtype = st.numberIndex(st.string({ trim: true }))

    expectAcceptValuesImpure(runtype, [{}])
  })

  it('rejects non-number keyed objects', () => {
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
      { [Symbol()]: 10 },
      JSON.parse('{ "__proto__": { "123": 2 } }'),
      {
        foo() {
          return 1
        },
      },
    ])
  })
})
