import { expectAcceptValuesPure, expectRejectValues, st } from './helpers'

describe('intersection', () => {
  const recordA = st.record({
    a: st.number(),
    b: st.optional(st.string()),
  })

  const recordB = st.record({
    c: st.boolean(),
  })

  const runtype = st.intersection(recordA, recordB)

  it('should accept intersected records', () => {
    expectAcceptValuesPure(runtype, [
      { c: true, b: 'foo', a: 1 },
      { c: false, a: 2 },
      { c: false, b: undefined, a: 3 },
    ])
  })

  it('should reject invalid records', () => {
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

  it('should not support intersecting basic types and records', () => {
    expect(() => st.intersection(st.string(), recordA)).toThrow(
      'cannot intersect a base type with a record',
    )
  })
})

describe('intersection of a (discriminated) union', () => {
  enum Tag {
    A = 'a_tag',
    B = 'b_tag',
    C = 'c_tag',
  }

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

  const runtypeUnion = st.union(runtypeA, runtypeB, runtypeC)

  const additionalAttributes = st.record({
    additional: st.number(),
    optional: st.optional(st.boolean()),
  })

  const runtype = st.intersection(runtypeUnion, additionalAttributes)

  it('should accept valid objects', () => {
    expectAcceptValuesPure(runtype, [
      { tag: 'b_tag', name: 'foo', additional: 123 },
      { tag: 'a_tag', id: 0, additional: 123 },
      { tag: 'a_tag', id: 0, additional: 123, optional: undefined },
      { tag: 'a_tag', id: 0, additional: 123, optional: true },
    ])
  })

  it('should reject invalid objects', () => {
    expectRejectValues(runtype, [
      { name: 'foo', additional: 123 }, // tag missing
      { tag: 'c_tag', id: 0, additional: 123 }, // tag wrong
      { tag: 'a_tag', additional: 123 }, // attr missin
      { tag: 'a_tag', id: 0 }, // additional missing
      { tag: 'a_tag', id: 0, optional: 123 }, // additional missing
      { tag: 'a_tag', id: 0, additional: '123', optional: [] }, // optional wrong

      // garbage
      {},
      [],
      null,
      undefined,
      0,
      NaN,
    ])
  })
})

describe('intersection of a (discriminated) union of different types', () => {
  enum Tag {
    A = 'a_tag',
    B = 2,
    C = 'c_tag',
  }

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

  const runtypeUnion = st.union(runtypeA, runtypeB, runtypeC)

  const additionalAttributes = st.record({
    additional: st.number(),
    optional: st.optional(st.boolean()),
  })

  const runtype = st.intersection(runtypeUnion, additionalAttributes)

  it('should accept valid objects', () => {
    expectAcceptValuesPure(runtype, [
      { tag: 2, name: 'foo', additional: 123 },
      { tag: 'a_tag', id: 0, additional: 123 },
      { tag: 'a_tag', id: 0, additional: 123, optional: undefined },
      { tag: 'a_tag', id: 0, additional: 123, optional: true },
    ])
  })

  it('should reject invalid objects', () => {
    expectRejectValues(runtype, [
      { name: 'foo', additional: 123 }, // tag missing
      { tag: 'c_tag', id: 0, additional: 123 }, // tag wrong
      { tag: 2, id: 0, additional: 123 }, // tag wrong
      { tag: 'a_tag', additional: 123 }, // attr missin
      { tag: 'a_tag', id: 0 }, // additional missing
      { tag: 'a_tag', id: 0, optional: 123 }, // additional missing
      { tag: 'a_tag', id: 0, additional: '123', optional: [] }, // optional wrong

      // garbage
      {},
      [],
      null,
      undefined,
      0,
      NaN,
    ])
  })
})
