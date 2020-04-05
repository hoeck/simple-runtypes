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
  error?: string | RegExp,
) {
  values.forEach(v => {
    expect(() => rt(v)).toThrow(error || /.*/)
  })
}

// properties defined on all js objects,
// need ensure that we're not silently accepting them anywhere
const objectAttributes = [
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  '__proto__',
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
]

function expectRejectObjectAttributes(
  rt: sr.Runtype<any>,
  error?: string | RegExp,
) {
  objectAttributes.forEach(a => {
    expect(() => rt(a)).toThrow(error || /.*/)
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
      -23,
      0,
      123456789,
      Number.MAX_SAFE_INTEGER,
      -Number.MAX_SAFE_INTEGER,
    ])
  })

  it('rejects non-integers', () => {
    expectRejectValues(
      sr.integer(),
      [
        NaN,
        1.1,
        0.0001,
        Infinity,
        '123',
        [],
        undefined,
        null,
        { a: 1 },
        Number.MAX_SAFE_INTEGER + 1,
        -Number.MAX_SAFE_INTEGER - 1,
      ],
      'expected an integer',
    )
  })
})

describe('stringAsInteger', () => {
  it('accepts integers in strings', () => {
    const values = [
      '1',
      '2',
      '0',
      '123456789',
      `${Number.MAX_SAFE_INTEGER}`,
      `${-Number.MAX_SAFE_INTEGER}`,
    ]

    values.forEach(v => {
      expect(sr.stringAsInteger()(v)).toEqual(parseInt(v, 10))
    })
  })

  it('rejects non string objects', () => {
    expectRejectValues(
      sr.stringAsInteger(),
      [NaN, 1.1, 0.0001, Infinity, [], undefined, null, { a: 1 }],
      'expected a string that contains an integer',
    )
  })

  it('rejects string that do not contain an integer', () => {
    expectRejectValues(
      sr.stringAsInteger(),
      ['NaN', 'Infinity', '{"asd": "f"}', '[]'],
      'expected an integer',
    )
  })

  it('rejects strings that contain additional trailing or leading characters', () => {
    expectRejectValues(
      sr.stringAsInteger(),
      ['123asd', '0000', '01', '-123,33', '33.44', '3e15'],
      'expected string to contain only the integer, not additional characters',
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

    expectRejectObjectAttributes(numericEnum, 'expected a value')
    expectRejectObjectAttributes(stringEnum, 'expected a value')
  })
})

describe('stringLiteralUnion', () => {
  it('accepts one out of a set of literal strings', () => {
    const runtype = sr.stringLiteralUnion('a', 'b', 'c')

    expectAcceptValues(runtype, ['c', 'a', 'b'])
  })

  it('accepts single literal string unions', () => {
    const runtype = sr.stringLiteralUnion('x')

    expectAcceptValues(runtype, ['x'])
  })

  it('rejects all values that are not in the literal strings', () => {
    const runtype = sr.stringLiteralUnion('a', 'b', 'c')

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

describe('guardedBy', () => {
  const guard = (v: unknown): v is string => typeof v === 'string'
  const runtype = sr.guardedBy(guard)

  it('accepts valid values', () => {
    expectAcceptValues(runtype, ['a', 'aa', ''])
  })

  it('rejects invalid values', () => {
    expectRejectValues(runtype, [null, undefined, 0, [], {}])
  })
})

describe('array', () => {
  it('accepts valid arrays', () => {
    const runtype = sr.array(sr.number())

    expectAcceptValues(runtype, [[], [1], [1, 2, 3]])
  })

  it('rejects invalid values and arrays', () => {
    const runtype = sr.array(sr.number())

    expectRejectValues(runtype, [undefined, null, ['asd'], [undefined, 1], '1'])
  })
})

describe('tuple', () => {
  it('accepts tuples', () => {
    const runtype = sr.tuple(sr.number(), sr.string(), sr.boolean())

    expectAcceptValues(runtype, [
      [1, 'foo', true],
      [2, 'bar', false],
    ])
  })

  it('always returns a new Array', () => {
    const runtype = sr.tuple(sr.number(), sr.string(), sr.boolean())

    const input = [1, 'foo', false]
    const value = runtype(input)

    expect(value).not.toBe(input)
  })

  it('rejects invalid values', () => {
    const runtype = sr.tuple(sr.number(), sr.string(), sr.boolean())

    expectRejectValues(runtype, [
      [1, 'foo', true, 'too-long'],
      [1, 'foo', null],
      [],
      undefined,
      null,
      [2, 'bar'],
      'asd',
      NaN,
    ])
  })
})

describe('stringIndex', () => {
  it('accepts string keyed objects', () => {
    const runtype = sr.stringIndex(sr.number())

    expectAcceptValues(runtype, [{ a: 1, b: 2 }, { a: 1 }, { 1: 1 }, {}])
  })

  it('always returns a new object', () => {
    const runtype = sr.stringIndex(sr.number())

    const input = {}
    const value = runtype(input)

    expect(value).not.toBe(input)
  })

  it('rejects non-string keyed objects', () => {
    const runtype = sr.stringIndex(sr.number())

    expectRejectValues(runtype, [
      undefined,
      null,
      0,
      '',
      false,
      'asd',
      [1, 2, 3],
      { 1: null },
      {
        foo() {
          return 1
        },
      },
    ])

    // symbol keys are ignored
    expect(runtype({ [Symbol()]: 10 })).toEqual({})
  })
})

describe('numberIndex', () => {
  it('accepts string keyed objects', () => {
    const runtype = sr.numberIndex(sr.number())

    expectAcceptValues(runtype, [{ 1: 100 }, { 100: 22, 101: 25 }, {}])
  })

  it('always returns a new object', () => {
    const runtype = sr.numberIndex(sr.number())

    const input = {}
    const value = runtype(input)

    expect(value).not.toBe(input)
  })

  it('rejects non-string keyed objects', () => {
    const runtype = sr.stringIndex(sr.number())

    expectRejectValues(runtype, [
      undefined,
      null,
      0,
      '',
      false,
      'asd',
      [1, 2, 3],
      { 1: null },
      {
        foo() {
          return 1
        },
      },
    ])

    // symbol keys are ignored
    expect(runtype({ [Symbol()]: 10 })).toEqual({})
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

  it('always returns a new object', () => {
    const runType = sr.record({
      a: sr.integer(),
      b: sr.string(),
    })

    const input = { a: 0, b: 'foo' }
    const value: { a: number; b: string } = runType(input)

    expect(value).not.toBe(input)
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

  it('rejects records with object attributes', () => {
    const runType = sr.record({
      x: sr.number(),
    })

    expectRejectValues(
      runType,
      // JSON.parse bc the __proto__ attr cannot be assigned in js
      objectAttributes.map(a => JSON.parse(`{"x": 1, "${a}": "x"}`)),
    )
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

    expectRejectValues(runtypeUnion, [
      { tag: 'x_tag', id: 123 },
      { tag: 'b_tag', name: [] },
      99,
      NaN,
      undefined,
      null,
      { tag: 'a_tag' },
      [],
      'foo',
    ])
  })

  it('should reject object property names as tags', () => {
    const runtypeUnion = sr.discriminatedUnion(
      'key',
      sr.record({ key: sr.literal('a'), value: sr.string() }),
      sr.record({ key: sr.literal('b'), value: sr.string() }),
    )

    expectRejectValues(
      runtypeUnion,
      // JSON parse bc you cant assign to the __proto__ key, but with json it works
      objectAttributes.map(a => JSON.parse(`{"key": "${a}", "value": "asd"}`)),
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

    expectRejectValues(runtype, [
      { c: true, b: 'foo', a: 1, d: [] },
      { c: true, b: 'foo', a: 'bar' },
      { b: 'foo', a: 1 },
      [],
      null,
      undefined,
      NaN,
      99,
    ])
  })
})
