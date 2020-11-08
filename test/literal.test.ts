import { expectRejectValues, st } from './helpers'

describe('literal', () => {
  type StringLiteral = 'foo'
  type NumberLiteral = 12
  type BooleanLiteral = true

  const literalString = st.literal('foo')
  const literalNumber = st.literal(12)
  const literalBoolean = st.literal(true)

  it('accepts a string literal', () => {
    const lit: StringLiteral = literalString('foo')

    expect(lit).toBe('foo')
  })

  it('accepts a number literal', () => {
    const lit: NumberLiteral = literalNumber(12)

    expect(lit).toBe(12)
  })

  it('accepts a boolean literal', () => {
    const lit: BooleanLiteral = literalBoolean(true)

    expect(lit).toBe(true)
  })

  it('rejects invalid literals', () => {
    expectRejectValues(
      literalString,
      ['bar', null, {}, undefined, 0, false, true, 12, NaN],
      'expected a literal',
    )

    expectRejectValues(
      literalNumber,
      ['bar', null, {}, undefined, 0, false, true, 13, NaN, 'foo'],
      'expected a literal',
    )

    expectRejectValues(
      literalBoolean,
      ['bar', null, {}, undefined, 0, false, 12, NaN, 'foo'],
      'expected a literal',
    )
  })
})
