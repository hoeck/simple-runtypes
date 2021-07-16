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

describe('discriminatedUnion with different tag types', () => {
  enum Tag {
    A = 'a_tag',
    B = 2,
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
      { tag: 2, name: 'abc' },
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
      { tag: 3, name: 'abc' },
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
})
