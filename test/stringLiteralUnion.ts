import {
  expectAcceptValuesPure,
  expectRejectObjectAttributes,
  expectRejectValues,
  st,
} from './helpers'

describe('stringLiteralUnion', () => {
  it('accepts one out of a set of literal strings', () => {
    const runtype = st.stringLiteralUnion('a', 'b', 'c')

    expectAcceptValuesPure(runtype, ['c', 'a', 'b'])
  })

  it('accepts single literal string unions', () => {
    const runtype = st.stringLiteralUnion('x')

    expectAcceptValuesPure(runtype, ['x'])
  })

  it('rejects all values that are not in the literal strings', () => {
    const runtype = st.stringLiteralUnion('a', 'b', 'c')

    expectRejectValues(runtype, [
      'x',
      [],
      undefined,
      null,
      '',
      'abc',
      {},
      new Date(),
      ['a'],
    ])
    expectRejectObjectAttributes(runtype)
  })
})
