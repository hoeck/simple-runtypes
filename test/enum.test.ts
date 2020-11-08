import {
  expectAcceptValuesPure,
  expectRejectObjectAttributes,
  expectRejectValues,
  st,
} from './helpers'

describe('enum', () => {
  enum NumericEnum {
    FOO_ONE = 1,
    BAR_TWO,
    BAZ_THREE,
  }

  enum StringEnum {
    FOO = 'foo',
    BAR = 'bar',
    BAZ = 'baz',
  }

  const numericEnum = st.enum(NumericEnum)
  const stringEnum = st.enum(StringEnum)

  it('accepts any enum value', () => {
    expectAcceptValuesPure(numericEnum, [1, 2, 3])
    expectAcceptValuesPure(stringEnum, ['foo', 'bar', 'baz'])
  })

  it('rejects non-enum values', () => {
    const values = [
      0,
      NaN,
      -1,
      1.1,
      'asd',
      {},
      undefined,
      null,
      '',
      'fo',
      'uuuh',
    ]

    expectRejectValues(numericEnum, values, 'expected a value')
    expectRejectValues(stringEnum, values, 'expected a value')

    expectRejectObjectAttributes(numericEnum, 'expected a value')
    expectRejectObjectAttributes(stringEnum, 'expected a value')
  })
})
