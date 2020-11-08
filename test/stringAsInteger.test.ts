import { expectRejectValues, st } from './helpers'

describe('stringAsInteger', () => {
  it('accepts integers in strings', () => {
    const values = [
      '1',
      '2',
      '0',
      '123456789',
      `${Number.MAX_SAFE_INTEGER}`,
      `${-Number.MAX_SAFE_INTEGER}`,
      '-0',
      '+0',
      '+123',
      '-123',
    ]

    values.forEach((v) => {
      expect(st.stringAsInteger()(v)).toEqual(parseInt(v, 10))
    })
  })

  it('rejects non string objects', () => {
    expectRejectValues(
      st.stringAsInteger(),
      [
        NaN,
        1.1,
        0.0001,
        Infinity,
        [],
        undefined,
        null,
        { a: 1 },
        ['1', '2', '3'],
      ],
      'expected a string that contains a safe integer',
    )
  })

  it('rejects string that do not contain an integer', () => {
    expectRejectValues(
      st.stringAsInteger(),
      [
        '',
        '-',
        '{"asd": "f"}',
        '[]',
        'NaN',
        'Infinity',
        'undefined',
        `${Number.MAX_SAFE_INTEGER + 1}`,
        `${Number.MIN_SAFE_INTEGER - 1}`,
      ],
      'expected a safe integer',
    )
  })

  it('rejects strings that contain additional trailing or leading characters', () => {
    expectRejectValues(
      st.stringAsInteger(),
      ['123asd', '0000', '01', '-123,33', '33.44', '3e15'],
      'expected string to contain only the safe integer, not additional characters, whitespace or leading zeros',
    )
  })

  it('rejects stringed integers smaller than min', () => {
    const rt = st.stringAsInteger({ min: -20 })
    const goodVals = ['-20', '0', '-19', '2000']
    const badVals = ['-21', '-2000']

    goodVals.forEach((v) => {
      expect(rt(v)).toEqual(parseInt(v, 10))
    })

    expectRejectValues(rt, badVals, 'expected the integer to be >= -20')
  })

  it('rejects stringed integers larger than max', () => {
    const rt = st.stringAsInteger({ max: 22 })
    const goodVals = ['22', '21', '0', '-2000']
    const badVals = ['23', '2000']

    goodVals.forEach((v) => {
      expect(rt(v)).toEqual(parseInt(v, 10))
    })

    expectRejectValues(rt, badVals, 'expected the integer to be <= 22')
  })
})
