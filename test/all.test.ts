import * as sr from '../src'

/// helpers

function expectAcceptValuesImpure<T>(rt: sr.Runtype<T>, values: unknown[]) {
  values.forEach((v) => {
    // use internal call protocol so that it does not raise but return sth
    // that can be reported by jest
    expect((rt as any)(v, sr.failSymbol)).toEqual(v)
    expect((rt as any)(v, sr.failSymbol)).not.toBe(v)
  })
}

function expectAcceptValuesPure<T>(rt: sr.Runtype<T>, values: unknown[]) {
  values.forEach((v) => {
    // use internal call protocol so that it does not raise but return sth
    // that can be reported by jest
    expect((rt as any)(v, sr.failSymbol)).toBe(v)
  })
}

function expectRejectValues<T>(
  rt: sr.Runtype<T>,
  values: unknown[],
  error?: string | RegExp,
) {
  // when using them internally, they return a Fail
  values.forEach((v) => {
    expect(() => (rt as any)(v, sr.failSymbol)).not.toThrow()
    expect((rt as any)(v, sr.failSymbol)).toEqual({
      [sr.failSymbol]: true,
      reason: expect.any(String),
      path: expect.any(Array),
    })
  })

  // when using runtypes as a normal user, they respond with throwing errors
  values.forEach((v) => {
    expect(() => rt(v)).toThrow(error || /.*/)
  })

  // when passing something that is not a failSymbol or undefined, they
  // respond with a usage error
  expect(() => (rt as any)(Symbol('wrong'), null)).toThrow(
    /failOrThrow must be undefined or the failSymbol/,
  )
  expect(() => (rt as any)(Symbol('wrong'), 0)).toThrow(
    /failOrThrow must be undefined or the failSymbol/,
  )
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
  objectAttributes.forEach((a) => {
    expect(() => rt(a)).toThrow(error || /.*/)
  })
}

/// tests

describe('number', () => {
  it('accepts numbers', () => {
    expectAcceptValuesPure(sr.number(), [123, 0, -0, 123e56])
  })

  it('rejects non-numbers', () => {
    expectRejectValues(
      sr.number(),
      ['123', '', {}, [], null, undefined],
      'expected a number',
    )
    expectRejectValues(sr.number(), [NaN], 'expected a number that is not NaN')
    expectRejectValues(
      sr.number(),
      [Infinity, -Infinity],
      'expected a finite number',
    )
  })

  it('optionally allows NaN', () => {
    const rt = sr.number({ allowNaN: true })

    expectAcceptValuesPure(rt, [123, 0, -0, 1.2, NaN])
    expectRejectValues(
      rt,
      ['asd', undefined, null, Infinity, -Infinity],
      'expected',
    )
  })

  it('optionally allows Infinite numbers', () => {
    const rt = sr.number({ allowInfinity: true })

    expectAcceptValuesPure(rt, [123, 0, -0, 1.123, Infinity, -Infinity])
    expectRejectValues(rt, ['asd', undefined, null, NaN], 'expected ')
  })

  it('optionally rejects numbers smaller than x', () => {
    const rt = sr.number({ min: 3.14 })

    expectAcceptValuesPure(rt, [123, 3.14])
    expectRejectValues(rt, [0, -1, 3.139], 'expected number to be >= 3.14')
    expectRejectValues(
      rt,
      ['asd', undefined, null, , -Infinity, Infinity, NaN], // eslint-disable-line no-sparse-arrays
      'expected ',
    )
  })

  it('optionally rejects numbers larger than x', () => {
    const rt = sr.number({ max: -2.3 })

    expectAcceptValuesPure(rt, [-2.301, -2.3, -100, -2.3e32])
    expectRejectValues(rt, [-2.299, -1, 3000], 'expected number to be <= -2.3')
    expectRejectValues(
      rt,
      ['asd', undefined, null, +Infinity, NaN],
      'expected ',
    )
  })

  it('combines all options', () => {
    const rt = sr.number({ max: 5, allowNaN: true, allowInfinity: true })

    expectAcceptValuesPure(rt, [0, -1, 5.0, -Infinity, NaN])
    expectRejectValues(
      rt,
      [[+Infinity, [], '123', undefined, null]],
      'expected ',
    )
  })
})

describe('integer', () => {
  it('accepts integers', () => {
    expectAcceptValuesPure(sr.integer(), [
      1,
      2,
      -23,
      0,
      123456789,
      Number.MAX_SAFE_INTEGER,
      -Number.MAX_SAFE_INTEGER,
    ])
  })

  it('accepts / rejects integers with restrictions', () => {
    expectAcceptValuesPure(sr.integer({ min: 11 }), [11, 1234])
    expectRejectValues(
      sr.integer({ min: 11 }),
      [10, 0],
      'expected the integer to be >= 11',
    )

    expectAcceptValuesPure(sr.integer({ max: -12 }), [-12, -100])
    expectRejectValues(
      sr.integer({ max: -12 }),
      [-11, 1],
      'expected the integer to be <=',
    )

    expectAcceptValuesPure(sr.integer({ min: 0, max: 2 }), [0, 1, 2])
    expectRejectValues(sr.integer({ min: 0, max: 2 }), [
      -1,
      1.2,
      NaN,
      3,
      200,
      'xx',
      undefined,
      Infinity,
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
        Number.MIN_SAFE_INTEGER - 1,
      ],
      'expected a safe integer',
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
      '-0',
      '+0',
      '+123',
      '-123',
    ]

    values.forEach((v) => {
      expect(sr.stringAsInteger()(v)).toEqual(parseInt(v, 10))
    })
  })

  it('rejects non string objects', () => {
    expectRejectValues(
      sr.stringAsInteger(),
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
      sr.stringAsInteger(),
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
      sr.stringAsInteger(),
      ['123asd', '0000', '01', '-123,33', '33.44', '3e15'],
      'expected string to contain only the safe integer, not additional characters, whitespace or leading zeros',
    )
  })

  it('rejects stringed integers smaller than min', () => {
    const rt = sr.stringAsInteger({ min: -20 })
    const goodVals = ['-20', '0', '-19', '2000']
    const badVals = ['-21', '-2000']

    goodVals.forEach((v) => {
      expect(rt(v)).toEqual(parseInt(v, 10))
    })

    expectRejectValues(rt, badVals, 'expected the integer to be >= -20')
  })

  it('rejects stringed integers larger than max', () => {
    const rt = sr.stringAsInteger({ max: 22 })
    const goodVals = ['22', '21', '0', '-2000']
    const badVals = ['23', '2000']

    goodVals.forEach((v) => {
      expect(rt(v)).toEqual(parseInt(v, 10))
    })

    expectRejectValues(rt, badVals, 'expected the integer to be <= 22')
  })
})

describe('string', () => {
  it('accepts strings', () => {
    expectAcceptValuesPure(sr.string(), ['asdf', '', '---', '\ufffe'])
  })

  it('accepts / rejects strings with restrictions', () => {
    expectAcceptValuesPure(sr.string({ maxLength: 3 }), [
      '',
      'a',
      ' a',
      '---',
      '\ufffe  ',
    ])

    expectRejectValues(
      sr.string({ maxLength: 3 }),
      ['    ', 'xxxxx'],
      'expected the string length to not exceed 3',
    )
  })

  it('trims strings', () => {
    const rt = sr.string({ trim: true })

    expect(rt(' foO   ')).toEqual('foO')
    expect(rt('foO')).toEqual('foO')
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

describe('stringLiteralUnion', () => {
  it('accepts one out of a set of literal strings', () => {
    const runtype = sr.stringLiteralUnion('a', 'b', 'c')

    expectAcceptValuesPure(runtype, ['c', 'a', 'b'])
  })

  it('accepts single literal string unions', () => {
    const runtype = sr.stringLiteralUnion('x')

    expectAcceptValuesPure(runtype, ['x'])
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

describe('undefined', () => {
  it('accepts undefined', () => {
    expectAcceptValuesPure(sr.undefined(), [undefined])
  })

  it('rejects non-undefined', () => {
    expectRejectValues(
      sr.undefined(),
      ['123', '', {}, [], null, 123],
      'expected undefined',
    )
  })
})

describe('null', () => {
  it('accepts null', () => {
    expectAcceptValuesPure(sr.null(), [null])
  })

  it('rejects non-null', () => {
    expectRejectValues(
      sr.null(),
      ['123', '', {}, [], undefined, 123],
      'expected null',
    )
  })
})

describe('guardedBy', () => {
  const guard = (v: unknown): v is string => typeof v === 'string'
  const runtype = sr.guardedBy(guard)

  it('accepts valid values', () => {
    expectAcceptValuesPure(runtype, ['a', 'aa', ''])
  })

  it('rejects invalid values', () => {
    expectRejectValues(runtype, [null, undefined, 0, [], {}])
  })
})

describe('array', () => {
  it('accepts valid arrays', () => {
    const runtype = sr.array(sr.number())

    expectAcceptValuesPure(runtype, [[], [1], [1, 2.2, 3.3]])
  })

  it('accepts / rejects arrays with maxLength restrictions', () => {
    const runtype = sr.array(sr.number(), { maxLength: 2 })

    expectAcceptValuesPure(runtype, [[], [1], [1, 2]])
    expectRejectValues(
      runtype,
      [
        [1, 2, 3],
        [1, 2, 3, 4],
      ],
      'expected the array to contain at most 2 elements',
    )
  })

  it('accepts / rejects arrays with minLength restrictions', () => {
    const runtype = sr.array(sr.number(), { minLength: 2 })

    expectAcceptValuesPure(runtype, [
      [1, 2, 3],
      [3, 2, 1, 0],
    ])
    expectRejectValues(
      runtype,
      [[], [0]],
      'expected the array to contain at least 2 elements',
    )
  })

  it('rejects invalid values and arrays', () => {
    const runtype = sr.array(sr.number())

    expectRejectValues(runtype, [undefined, null, ['asd'], [undefined, 1], '1'])
  })
})

describe('tuple', () => {
  it('accepts tuples', () => {
    const runtype = sr.tuple(sr.number(), sr.string(), sr.boolean())

    expectAcceptValuesPure(runtype, [
      [1, 'foo', true],
      [2, 'bar', false],
    ])
  })

  it('returns a new Array if any nested runtype is impure', () => {
    const runtype = sr.tuple(
      sr.number(),
      sr.string({ trim: true }),
      sr.boolean(),
    )

    expectAcceptValuesImpure(runtype, [[1, 'foo', false]])
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

    expectAcceptValuesPure(runtype, [{ a: 1, b: 2 }, { a: 1 }, { 1: 1 }, {}])
  })

  it('returns a new object if the runtype is impure', () => {
    const runtype = sr.stringIndex(sr.string({ trim: true }))

    expectAcceptValuesImpure(runtype, [{}])
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

describe('numberIndex', () => {
  it('accepts string keyed objects', () => {
    const runtype = sr.numberIndex(sr.number())

    expectAcceptValuesPure(runtype, [{ 1: 100 }, { 100: 22, 101: 25 }, {}])
  })

  it('returns a new object when using an impure runtype', () => {
    const runtype = sr.numberIndex(sr.string({ trim: true }))

    expectAcceptValuesImpure(runtype, [{}])
  })

  it('rejects non-number keyed objects', () => {
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

describe('record', () => {
  it('accepts simple records', () => {
    const runtype = sr.record({
      a: sr.integer(),
      b: sr.string(),
    })

    expectAcceptValuesPure(runtype, [{ a: 0, b: 'foo' }])
  })

  it('returns a new object when nested runtypes are impure', () => {
    const runtype = sr.record({
      a: sr.integer(),
      b: sr.string({ trim: true }),
    })

    expectAcceptValuesImpure(runtype, [{ a: 0, b: 'foo' }])
  })

  it('accepts empty records', () => {
    const runType = sr.record({})

    const value: {} = runType({})

    expect(value).toEqual({})
  })

  it('accepts records with optional values', () => {
    const runtype = sr.record({
      a: sr.integer(),
      b: sr.optional(sr.string()),
    })

    let value: { a: number; b?: string }

    value = runtype({ a: 0, b: 'foo' })
    expect(value).toEqual({ a: 0, b: 'foo' })

    value = runtype({ a: 0, b: undefined })
    expect(value).toEqual({ a: 0, b: undefined })
  })

  it('accepts nested records', () => {
    const runtype = sr.record({
      a: sr.record({
        b: sr.record({
          c: sr.string(),
        }),
      }),
    })

    let value: { a: { b: { c: string } } }

    // eslint-disable-next-line prefer-const
    value = runtype({ a: { b: { c: 'foo' } } })
    expect(value).toEqual({ a: { b: { c: 'foo' } } })
  })

  it('returns runtypes values', () => {
    const runtype = sr.record({
      a: sr.record({
        b: sr.record({
          c: sr.string({ trim: true }), // returns a modified string
        }),
      }),
    })

    let value: { a: { b: { c: string } } }

    // eslint-disable-next-line prefer-const
    value = runtype({ a: { b: { c: '  foo  ' } } })

    expect(value).toEqual({ a: { b: { c: 'foo' } } })
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
      objectAttributes.map((a) => JSON.parse(`{"x": 1, "${a}": "x"}`)),
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

    expectAcceptValuesPure(runtypeUnion, [
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
      objectAttributes.map((a) =>
        JSON.parse(`{"key": "${a}", "value": "asd"}`),
      ),
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

    expectAcceptValuesPure(runtype, [
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

describe('union', () => {
  const runtype = sr.union(
    sr.string(),
    sr.number(),
    sr.record({ a: sr.boolean(), b: sr.optional(sr.number()) }),
  )

  it('should accept values in the union type', () => {
    expectAcceptValuesPure(runtype, [
      'asd',
      123,
      -1.24,
      '',
      { a: false },
      { a: true, b: 123 },
    ])
  })

  it('should reject invalid values not in the union type', () => {
    expectRejectValues(runtype, [
      false,
      undefined,
      NaN,
      [],
      {},
      { b: 123 },
      { a: 'string' },
    ])
  })
})

describe('pick & omit', () => {
  const record = sr.record({
    a: sr.number(),
    b: sr.optional(sr.string()),
    c: sr.boolean(),
  })

  const pickedRt = sr.pick(record, 'a', 'b')
  const omittedRt = sr.omit(record, 'c')

  it('should select some fields', () => {
    const acceptedValues = [
      { a: 1 },
      { a: 2, b: undefined },
      { a: 3, b: 'abc' },
    ]

    expectAcceptValuesPure(pickedRt, acceptedValues)
    expectAcceptValuesPure(omittedRt, acceptedValues)
  })

  it('should reject omitted/non-picked fields', () => {
    const rejectedValues = [
      { c: true, a: 1 },
      { c: false, a: 2, b: undefined },
      { c: false, a: 3, b: 'abc' },
      { a: 'string', b: 'abc' },
      { a: 1, b: 123 },
      {},
      123,
      null,
      undefined,
    ]

    expectRejectValues(pickedRt, rejectedValues)
    expectRejectValues(omittedRt, rejectedValues)
  })
})

describe('error messages', () => {
  const runtypeA = sr.record({
    a: sr.string(),
    b: sr.array(
      sr.record({
        point: sr.tuple(sr.number(), sr.number()),
      }),
    ),
  })

  it('should report the full path to an invalid value', () => {
    try {
      runtypeA({ a: 'foo', b: [{ point: [12, 13] }, { point: [12, null] }] })
    } catch (e) {
      expect(sr.getFormattedErrorPath(e)).toEqual('b[1].point[1]')
      expect(sr.getFormattedError(e)).toEqual(
        'RuntypeError: expected a number at `value.b[1].point[1]` in `{"a":"foo","b":[{"point":[12,13]},{"point":[12,null]}]}`',
      )
    }
  })
})

describe('custom runtypes', () => {
  const rt = sr.runtype((v) => {
    if (v === 31) {
      return 31
    }

    if (v === '-') {
      return '-'
    }

    return sr.fail('not the right type')
  })

  it('should create a custom runtype', () => {
    expectAcceptValuesPure(rt, ['-', 31])
    expectRejectValues(rt, ['31', null, 123, []])
  })

  it('should not throw an exception when used internally', () => {
    expect((rt as any)(123, sr.failSymbol)).toEqual(
      expect.objectContaining({
        [sr.failSymbol]: true,
        reason: 'not the right type',
      }),
    )
  })
})
