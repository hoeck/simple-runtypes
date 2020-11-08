import {
  expectAcceptValuesImpure,
  expectAcceptValuesPure,
  expectRejectValues,
  st,
} from './helpers'

describe('tuple', () => {
  it('accepts tuples', () => {
    const runtype = st.tuple(st.number(), st.string(), st.boolean())

    expectAcceptValuesPure(runtype, [
      [1, 'foo', true],
      [2, 'bar', false],
    ])
  })

  it('returns a new Array if any nested runtype is impure', () => {
    const runtype = st.tuple(
      st.number(),
      st.string({ trim: true }),
      st.boolean(),
    )

    expectAcceptValuesImpure(runtype, [[1, 'foo', false]])
  })

  it('rejects invalid values', () => {
    const runtype = st.tuple(st.number(), st.string(), st.boolean())

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
