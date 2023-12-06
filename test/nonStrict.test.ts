import {
  expectAcceptValuesImpure,
  expectRejectValues,
  objectAttributes,
  st,
} from './helpers'

describe('nonStrict', () => {
  it('accepts records', () => {
    const runtype = st.nonStrict(
      st.record({
        a: st.integer(),
        b: st.string(),
      }),
    )

    // a nonStrict runtype is always impure
    expectAcceptValuesImpure(
      runtype,
      [
        [
          { a: 0, b: 'foo', c: true }, // ignores additional keys
          { a: 0, b: 'foo' },
        ],
      ],
      true,
    )
  })

  it('accepts nonStrict records', () => {
    const runtype = st.nonStrict(
      st.nonStrict(
        st.record({
          a: st.integer(),
          b: st.string(),
        }),
      ),
    )

    expectAcceptValuesImpure(
      runtype,
      [
        [
          { a: 0, b: 'foo', c: true },
          { a: 0, b: 'foo' },
        ],
      ],
      true,
    )
  })

  it('accepts records with optional values', () => {
    const runtype = st.nonStrict(
      st.record({
        a: st.integer(),
        b: st.optional(st.string()),
      }),
    )

    expectAcceptValuesImpure(
      runtype,
      [
        [
          { a: 0, b: 'foo', c: true },
          { a: 0, b: 'foo' },
        ],
        [
          { a: 0, b: undefined, c: true }, // ignores additional keys
          { a: 0, b: undefined },
        ],
      ],
      true,
    )
  })

  it('accepts nested records and does not apply recursively', () => {
    const runtype = st.nonStrict(
      st.record({
        a: st.record({
          b: st.record({
            c: st.string(),
          }),
        }),
      }),
    )

    expectAcceptValuesImpure(
      runtype,
      [[{ a: { b: { c: 'foo' } }, d: 0 }, { a: { b: { c: 'foo' } } }]],
      true,
    )
    expectRejectValues(runtype, [
      { a: { b: { c: 'foo' }, d: 0 } },
      { a: { b: { c: 'foo', d: 0 } } },
    ])
  })

  it('rejects runtypes that are not records', () => {
    const nonRecordRuntypes: any[] = [
      st.array(st.string()),
      st.dictionary(st.union(st.literal('a'), st.literal('b')), st.boolean()),
      st.enum({ A: 'a', B: 'b' }),
      st.literal(0),
      st.null(),
      st.string(),
      st.tuple(st.string(), st.number()),
      st.undefined(),
      st.union(st.string(), st.number()),

      // An intersection runtype not between two record runtypes. This is because an intersection between two
      // record runtypes would result in a record runtype, which is valid to use with nonStrict.
      st.intersection(
        st.union(
          st.record({ tier: st.literal('One'), price: st.number() }),
          st.record({
            tier: st.literal('Two'),
            price: st.number(),
            access: st.boolean(),
          }),
        ),
        st.record({ c: st.boolean() }),
      ),
    ]

    nonRecordRuntypes.forEach((runtype) => {
      expect(() => {
        st.nonStrict(runtype)
      }).toThrow('expected a record runtype')
    })
  })

  // same as the former sloppyRecord test
  it('ignores object attributes', () => {
    const runType = st.nonStrict(
      st.record({
        x: st.number(),
      }),
    )

    objectAttributes
      // JSON.parse bc the __proto__ attr cannot be assigned in js
      .map((a) => ({ a, o: JSON.parse(`{"x": 1, "${a}": {"y":2}}`) }))
      .forEach(({ a, o }) => {
        const x = runType(o)
        const y = runType(Object.assign({}, o))
        expect(x).not.toBe(o)
        expect(x).toEqual({ x: 1 })
        expect(y).toEqual({ x: 1 })
        expect((x as any).y).toBeUndefined()
        expect((y as any).y).toBeUndefined()
        expect(Object.prototype.hasOwnProperty.call(x, a)).toBeFalsy()
        expect(Object.prototype.hasOwnProperty.call(y, a)).toBeFalsy()
      })
  })
})
