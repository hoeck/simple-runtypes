import {
  expectAcceptValuesPure,
  expectRejectValues,
  objectAttributes,
  st,
} from './helpers'

describe('union', () => {
  const runtype = st.union(
    st.string(),
    st.number(),
    st.record({ a: st.boolean(), b: st.optional(st.number()) }),
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

describe('discriminated union', () => {
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

  const runtypeA = st.record({
    tag: st.literal(Tag.A),
    id: st.number(),
  })

  const runtypeB = st.record({
    tag: st.literal(Tag.B),
    name: st.string(),
  })

  const runtypeC = st.record({
    tag: st.literal(Tag.C),
    value: st.optional(st.record({ a: st.number() })),
  })

  it('should accept records that belong to the discriminatedUnion', () => {
    const runtypeUnion: st.Runtype<Union> = st.union(
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
    const runtypeUnion = st.union(runtypeA, runtypeB, runtypeC)

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
    const runtypeUnion = st.union(
      st.record({ key: st.literal('a'), value: st.string() }),
      st.record({ key: st.literal('b'), value: st.string() }),
    )

    expectRejectValues(
      runtypeUnion,
      // JSON parse bc you cant assign to the __proto__ key, but with json it works
      objectAttributes.map((a) =>
        JSON.parse(`{"key": "${a}", "value": "asd"}`),
      ),
    )

    // proto hacks
    expectRejectValues(runtypeUnion, [
      JSON.parse(`{"__proto__": {"key": "a", "value": "asd"}}`),
      JSON.parse(
        `{"__proto__": {"key": "a", "value": "asd"}, "key": "a", "value": "asd"}`,
      ),
    ])
  })

  it('should allow numbers and booleans as discrimination literals too', () => {
    const runtype = st.union(
      st.record({
        type: st.literal(1),
        number: st.number(),
      }),
      st.record({ type: st.literal(true), boolean: st.boolean() }),
      st.record({ type: st.literal('a'), string: st.string() }),
    )

    expectAcceptValuesPure(runtype, [
      { type: 1, number: 2 },
      { type: true, boolean: false },
      { type: 'a', string: 'b' },
    ])

    expectRejectValues(runtype, [
      // incorrect type
      { type: 1, number: 'foo' },
      { type: 1, boolean: false },
      { type: true, boolean: 1 },
      { type: true, boolean: false, number: 1 },
      { type: 'a', number: 1 },
      { type: 'a', string: 'a', boolean: false, number: 1 },
      { type: 'a', string: false },
      // non-existing type discriminator
      { type: 2 },
      { type: 2, number: 2 },
      { type: false, boolean: true },
      { type: false, number: 1 },
      { type: 'b', string: 'a' },
      { type: 'c' },
      { type: '' },
      // completely missing type literal
      { type: null },
      { string: 'b' },
      {},
      { number: false },
      { boolean: 1 },
      { a: 1 },
    ])
  })
})
