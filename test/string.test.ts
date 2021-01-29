import { expectAcceptValuesPure, expectRejectValues, st } from './helpers'

describe('string', () => {
  it('accepts strings', () => {
    expectAcceptValuesPure(st.string(), ['asdf', '', '---', '\ufffe'])
  })

  it('accepts / rejects strings with restrictions', () => {
    expectAcceptValuesPure(st.string({ maxLength: 3 }), [
      '',
      'a',
      ' a',
      '---',
      '\ufffe  ',
    ])

    expectRejectValues(
      st.string({ maxLength: 3 }),
      ['    ', 'xxxxx'],
      'expected the string length to not exceed 3',
    )
  })

  it('trims strings', () => {
    const rt = st.string({ trim: true })

    expect(rt(' foO   ')).toEqual('foO')
    expect(rt('foO')).toEqual('foO')
  })

  it('rejects non-strings', () => {
    expectRejectValues(
      st.string(),
      [123, [], /asd/, undefined, null],
      'expected a string',
    )
  })
})
