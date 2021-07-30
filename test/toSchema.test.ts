import { st } from './helpers'

describe('toSchema', () => {
  it('should work with any', () => {
    const runtype = st.any()
    expect(st.toSchema(runtype)).toBe('any')
  })

  it('should work with array', () => {
    const strArr = st.array(st.string())
    const boolArr = st.array(st.boolean())

    expect(st.toSchema(strArr)).toBe('string[]')
    expect(st.toSchema(boolArr)).toBe('boolean[]')
  })

  it('should work with boolean', () => {
    const runtype = st.boolean()
    expect(st.toSchema(runtype)).toBe('boolean')
  })

  it('should work with custom', () => {
    const runtype = st.runtype((v) => v)
    expect(st.toSchema(runtype)).toBe('any')
  })

  it('should work with custom and base runtype', () => {
    const runtype = st.runtype((v) => v, st.stringAsInteger())
    expect(st.toSchema(runtype)).toBe('string')
  })

  it('should work with dictionary', () => {
    const runtype = st.dictionary(st.string(), st.boolean())
    expect(st.toSchema(runtype)).toBe('Record<string, boolean>')
  })

  it('should work with enum', () => {
    const runtype = st.enum({ '1': 'one', 2: 'two' })
    expect(st.toSchema(runtype)).toBe('"1" | "2"')
  })

  it('should work with guardedBy', () => {
    const runtype = st.guardedBy((v): v is boolean => !!v)
    expect(st.toSchema(runtype)).toBe('any')
  })

  it('should work with guardedBy with base runtype', () => {
    type EvenIntStr = string & { _: never }
    const guard = (
      originalValue: unknown,
      baseRuntypeValue: number,
    ): originalValue is EvenIntStr => baseRuntypeValue % 2 === 0

    const runtype = st.guardedBy(guard, st.stringAsInteger())
    expect(st.toSchema(runtype)).toBe('string')
  })

  it('should work with ignore', () => {
    const runtype = st.ignore()
    expect(st.toSchema(runtype)).toBe('any')
  })

  it('should work with integer', () => {
    const runtype = st.integer()
    const minRuntype = st.integer({ min: 1 })

    expect(st.toSchema(runtype)).toBe('number')
    expect(st.toSchema(minRuntype)).toBe('number')
  })

  it('should work with record intersection', () => {
    const runtype = st.intersection(
      st.record({ a: st.string() }),
      st.record({ b: st.number() }),
    )
    expect(st.toSchema(runtype)).toBe(
      [
        // force multi line
        '{',
        '  a: string;',
        '  b: number;',
        '}',
      ].join('\n'),
    )
  })

  it('should work with literal intersection', () => {
    const runtype = st.intersection(st.string(), st.literal('abc'))
    expect(st.toSchema(runtype)).toBe('string & "abc"')
  })

  it('should work with json', () => {
    const runtype = st.json(st.array(st.integer()))
    expect(st.toSchema(runtype)).toBe('string')
  })

  it('should work with literal', () => {
    const abcRt = st.literal('abc')
    const oneRt = st.literal(1)
    const falseRt = st.literal(false)
    expect(st.toSchema(abcRt)).toBe('"abc"')
    expect(st.toSchema(oneRt)).toBe('1')
    expect(st.toSchema(falseRt)).toBe('false')
  })

  it('should work with null', () => {
    const runtype = st.null()
    expect(st.toSchema(runtype)).toBe('null')
  })

  it('should work with nullOr', () => {
    const runtype = st.nullOr(st.string())
    expect(st.toSchema(runtype)).toBe('null | string')
  })

  it('should work with number', () => {
    const runtype = st.number()
    expect(st.toSchema(runtype)).toBe('number')
  })

  it('should work with object', () => {
    const runtype = st.object()
    expect(st.toSchema(runtype)).toBe('{}')
  })

  it('should work with omit', () => {
    const record = st.record({ a: st.string(), b: st.number() })
    const runtype = st.omit(record, 'b')
    expect(st.toSchema(runtype)).toBe(
      [
        // force multi line
        '{',
        '  a: string;',
        '}',
      ].join('\n'),
    )
  })

  it('should work with optional', () => {
    const runtype = st.record({ a: st.string(), b: st.optional(st.number()) })
    expect(st.toSchema(runtype)).toBe(
      [
        // force multi line
        '{',
        '  a: string;',
        '  b?: number;',
        '}',
      ].join('\n'),
    )
  })

  it('should work with partial', () => {
    const record = st.record({ a: st.string(), b: st.number() })
    const runtype = st.partial(record)
    expect(st.toSchema(runtype)).toBe(
      [
        // force multi line
        '{',
        '  a?: string;',
        '  b?: number;',
        '}',
      ].join('\n'),
    )
  })

  it('should work with pick', () => {
    const record = st.record({ a: st.string(), b: st.number() })
    const runtype = st.pick(record, 'b')
    expect(st.toSchema(runtype)).toBe(
      [
        // force multi line
        '{',
        '  b: number;',
        '}',
      ].join('\n'),
    )
  })

  it('should work with record', () => {
    const runtype = st.record({ a: st.string() })
    expect(st.toSchema(runtype)).toBe(
      [
        // force multi line
        '{',
        '  a: string;',
        '}',
      ].join('\n'),
    )
  })

  it('should work with sloppy record', () => {
    const runtype = st.sloppyRecord({ a: st.string() })
    expect(st.toSchema(runtype)).toBe(
      [
        // force multi line
        '{',
        '  a: string;',
        '}',
      ].join('\n'),
    )
  })

  it('should work with string', () => {
    const impureRuntype = st.string({ trim: true })
    const pureRuntype = st.string()

    expect(st.toSchema(impureRuntype)).toBe('string')
    expect(st.toSchema(pureRuntype)).toBe('string')
  })

  it('should work with stringAsInteger', () => {
    const runtype = st.stringAsInteger()

    expect(st.toSchema(runtype)).toBe('string')
  })

  it('should work with stringLiteralUnion', () => {
    const runtype = st.stringLiteralUnion('a', 'b', 'c')

    expect(st.toSchema(runtype)).toBe('a | b | c')
  })

  it('should work with tuple', () => {
    const runtype = st.tuple(st.string(), st.number())

    expect(st.toSchema(runtype)).toBe('[string, number]')
  })

  it('should work with undefined', () => {
    const runtype = st.undefined()

    expect(st.toSchema(runtype)).toBe('never')
  })

  it('should work with undefinedOr', () => {
    const runtype = st.undefinedOr(st.string())

    expect(st.toSchema(runtype)).toBe('never')
  })

  it('should work with union', () => {
    const runtype = st.union(
      st.record({ a: st.literal('a') }),
      st.record({ a: st.literal('b') }),
    )

    expect(st.toSchema(runtype)).toBe(
      [
        // force multi line
        '{',
        '  a: "a";',
        '} | {',
        '  a: "b";',
        '}',
      ].join('\n'),
    )
  })

  it('should work with unknown', () => {
    const runtype = st.unknown()

    expect(st.toSchema(runtype)).toBe('any')
  })

  it('should work with complex runtypes', () => {
    const runtype = st.record({
      a: st.union(st.literal('a'), st.boolean()),
      b: st.array(st.number()),
      c: st.tuple(st.literal(true), st.boolean(), st.stringAsInteger()),
      d: st.record({ aa: st.dictionary(st.string(), st.tuple(st.number())) }),
    })

    expect(st.toSchema(runtype)).toBe(
      [
        // force multi line
        '{',
        '  a: "a" | boolean;',
        '  b: number[];',
        '  c: [true, boolean, string];',
        '  d: {',
        '  aa: Record<string, [number]>;',
        '};',
        '}',
      ].join('\n'),
    )
  })
})
