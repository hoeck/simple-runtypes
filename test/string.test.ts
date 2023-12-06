import {
  expectAcceptValuesImpure,
  expectAcceptValuesPure,
  expectRejectValues,
  st,
} from './helpers'

describe('string', () => {
  it('accepts strings', () => {
    expectAcceptValuesPure(st.string(), ['asdf', '', '---', '\ufffe'])
  })

  it('accepts / rejects strings with minLength restrictions', () => {
    const rt = st.string({ minLength: 3 })

    expectAcceptValuesPure(rt, [
      '   ',
      'äbc',
      ' a b c d e f g ',
      '---------------',
      '\ufffe  ',
    ])

    expectRejectValues(
      rt,
      ['', '  ', 'x', 'äb'],
      'expected the string length to be at least 3',
    )
  })

  it('accepts / rejects strings with maxLength restrictions', () => {
    const rt = st.string({ maxLength: 3 })

    expectAcceptValuesPure(rt, ['', 'a', ' a', '---', '\ufffe  '])

    expectRejectValues(
      rt,
      ['    ', 'xxxxx'],
      'expected the string length to not exceed 3',
    )
  })

  it('accepts / rejects strings with minLength and maxLength restrictions', () => {
    const rt = st.string({ minLength: 3, maxLength: 3 })

    expectAcceptValuesPure(rt, ['   ', 'äbc', ' a ', '---', '\ufffe  ', '123'])

    expectRejectValues(
      rt,
      ['', '  ', 'x', 'äb', 'äbcd', '1234'],
      /expected the string length to (?:be at least|not exceed) 3/,
    )
  })

  it('trims strings', () => {
    const rt = st.string({ trim: true })

    expect(rt(' foO   ')).toEqual('foO')
    expect(rt('foO')).toEqual('foO')
  })

  it('trims before it checks the string minLength', () => {
    const rt = st.string({ trim: true, minLength: 1 })

    expect(rt('a')).toEqual('a')
    expectAcceptValuesImpure(
      rt,
      [
        [' a', 'a'],
        [' a   ', 'a'],
        [' aa', 'aa'],
        ['   a a ', 'a a'],
      ],
      true,
    )

    expectRejectValues(rt, ['       ', '  ', ' ', '', 0, []])
  })

  it('trims before it checks the string maxLength', () => {
    const rt = st.string({ trim: true, maxLength: 3 })

    expect(rt('abc')).toEqual('abc')
    expectAcceptValuesImpure(
      rt,
      [
        [' abc', 'abc'],
        ['abc   ', 'abc'],
        ['   a c ', 'a c'],
        [' ', ''],
        ['        ', ''],
        ['a ', 'a'],
      ],
      true,
    )

    expectRejectValues(rt, ['abcd', 'abcd ', '  abcd   ', 'a  d ', 0, []])
  })

  it('rejects non-strings', () => {
    expectRejectValues(
      st.string(),
      [123, [], /asd/, undefined, null],
      'expected a string',
    )
  })

  it('accepts / rejects strings depending on matching RegExp', () => {
    const rt = st.string({ match: /^[0-9a-f]{8}$/ })

    expectAcceptValuesPure(rt, ['03a7ffb6', '00112233'])

    expectRejectValues(
      rt,
      [' 3a7ffb6', ' 3a7ffb61', '001122', 'X11aa22bb', '03A7ffb6'],
      'expected the string to match /^[0-9a-f]{8}$/',
    )
  })

  it('trims before applying match', () => {
    const rt = st.string({ match: /^[0-9a-f]{8}$/, trim: true })

    expectAcceptValuesImpure(
      rt,
      [
        [' affeaffe', 'affeaffe'],
        [' affeaffe  ', 'affeaffe'],
      ],
      true,
    )

    expectRejectValues(rt, [' affea ffe ', ' '])
  })
})
