import * as sr from '../src'

/// helpers

function expectAcceptValues<T>(rt: sr.Runtype<T>, values: unknown[]) {
  values.forEach(v => {
    expect(rt(v)).toEqual(v)
  })
}

function expectRejectValues<T>(
  rt: sr.Runtype<T>,
  values: unknown[],
  error: string | RegExp,
) {
  values.forEach(v => {
    expect(() => rt(v)).toThrow(error)
  })
}

/// tests

describe('number', () => {
  it('accepts numbers', () => {
    expectAcceptValues(sr.number(), [123, 0, -0, Infinity, -Infinity, 123e5678])
  })

  it('rejects non-numbers', () => {
    expectRejectValues(
      sr.number(),
      ['123', '', {}, [], null, undefined],
      'expected a number',
    )
  })
})

describe('integer', () => {
  it('accepts integers', () => {
    expectAcceptValues(sr.integer(), [
      1,
      2,
      0,
      123456789,
      Number.MAX_SAFE_INTEGER,
      -Number.MAX_SAFE_INTEGER,
    ])
  })

  it('rejects non-integers', () => {
    expectRejectValues(
      sr.integer(),
      [NaN, 1.1, 0.0001, Infinity, '123', [], undefined, null, { a: 1 }],
      'expected an integer',
    )
  })
})

describe('string', () => {
  it('accepts strings', () => {
    expectAcceptValues(sr.string(), ['asdf', '', '---', '\ufffe'])
  })

  it('rejects non-strings', () => {
    expectRejectValues(
      sr.string(),
      [123, [], /asd/, undefined, null],
      'expected a string',
    )
  })
})

describe('literal', () => {
  type StringLiteral = 'foo'
  type NumberLiteral = 12
  type BooleanLiteral = true

  const literalString = sr.literal('foo')
  const literalNumber = sr.literal(12)
  const literalBoolean = sr.literal(true)

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

describe('enumValue', () => {
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

  const numericEnum = sr.enumValue(NumericEnum)
  const stringEnum = sr.enumValue(StringEnum)

  it('accepts any enum value', () => {
    expectAcceptValues(numericEnum, [1, 2, 3])
    expectAcceptValues(stringEnum, ['foo', 'bar', 'baz'])
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
  })
})

describe('tuple', () => {
  it('accepts tuples', () => {
    const runtype = sr.tuple(sr.number(), sr.string(), sr.boolean())

    expectAcceptValues(runtype, [[1, 'foo', true], [2, 'bar', false]])
  })

  it('rejects invalid values', () => {
    const runtype = sr.tuple(sr.number(), sr.string(), sr.boolean())

    expectRejectValues(
      runtype,
      [[1, 'foo', null], [], undefined, null, [2, 'bar'], 'asd', NaN],
      /(expected a boolean)|(expected a number)|(expected an Array)/,
    )
  })
})

describe('record', () => {
  it('accepts simple records', () => {
    const runType = sr.record({
      a: sr.integer(),
      b: sr.string(),
    })

    const value: { a: number; b: string } = runType({ a: 0, b: 'foo' })

    expect(value).toEqual({ a: 0, b: 'foo' })
  })

  it('accepts empty records', () => {
    const runType = sr.record({})

    const value: {} = runType({})

    expect(value).toEqual({})
  })

  it('accepts records with optional values', () => {
    const runType = sr.record({
      a: sr.integer(),
      b: sr.optional(sr.string()),
    })

    let value: { a: number; b?: string }

    value = runType({ a: 0, b: 'foo' })
    expect(value).toEqual({ a: 0, b: 'foo' })

    value = runType({ a: 0, b: undefined })
    expect(value).toEqual({ a: 0, b: undefined })
  })

  it('rejects records with non-mapped keys', () => {
    const runType = sr.record({
      a: sr.integer(),
      b: sr.string(),
    })

    expect(() =>
      runType({ a: 1, b: 'foo', c: 'not-in-record-definition' }),
    ).toThrow('invalid keys in record')
  })
})

describe('discriminatedUnion', () => {
  enum Tag {
    A = 'a_tag',
    B = 'b_tag',
    C = 'c_tag',
  }

  interface A {
    tag: Tag.A
    id: number
  }

  interface B {
    tag: Tag.B
    name: string
  }

  interface C {
    tag: Tag.C
    value?: { a: number }
  }

  type Union = A | B | C

  const runtypeA = sr.record({
    tag: sr.literal(Tag.A),
    id: sr.number(),
  })

  const runtypeB = sr.record({
    tag: sr.literal(Tag.B),
    name: sr.string(),
  })

  const runtypeC = sr.record({
    tag: sr.literal(Tag.C),
    value: sr.optional(sr.record({ a: sr.number() })),
  })

  it('should accept records that belong to the discriminatedUnion', () => {
    const runtypeUnion: sr.Runtype<Union> = sr.discriminatedUnion(
      'tag',
      runtypeA,
      runtypeB,
      runtypeC,
    )

    expectAcceptValues(runtypeUnion, [
      { tag: 'a_tag', id: 123 },
      { tag: Tag.B, name: 'asd' },
      { tag: 'c_tag', value: { a: 123 } },
      { tag: 'c_tag' },
      { tag: 'c_tag', value: undefined },
    ])
  })

  it('should reject records that do not belong to the discriminatedUnion', () => {
    const runtypeUnion: sr.Runtype<Union> = sr.discriminatedUnion(
      'tag',
      runtypeA,
      runtypeB,
      runtypeC,
    )

    expectRejectValues(
      runtypeUnion,
      [
        { tag: 'x_tag', id: 123 },
        { tag: 'b_tag', name: [] },
        99,
        NaN,
        undefined,
        null,
        { tag: 'a_tag' },
        [],
        'foo',
      ],
      /(no Runtype found for discriminated union)|(expected a string)|(expected an object)|(expected a number)/,
    )
  })
})

describe('intersection', () => {
  const recordA = sr.record({
    a: sr.number(),
    b: sr.optional(sr.string()),
  })

  const recordB = sr.record({
    c: sr.boolean(),
  })

  it('should accept intersected records', () => {
    const runtype = sr.intersection(recordA, recordB)

    expectAcceptValues(runtype, [
      { c: true, b: 'foo', a: 1 },
      { c: false, a: 2 },
      { c: false, b: undefined, a: 3 },
    ])
  })

  it('should reject invalid', () => {
    const runtype = sr.intersection(recordA, recordB)

    expectRejectValues(
      runtype,
      [
        { c: true, b: 'foo', a: 1, d: [] },
        { c: true, b: 'foo', a: 'bar' },
        { b: 'foo', a: 1 },
        [],
        null,
        undefined,
        NaN,
        99,
      ],
      /(invalid key)|(expected a number)|(expected a boolean)|(expected an object)/,
    )
  })
})
