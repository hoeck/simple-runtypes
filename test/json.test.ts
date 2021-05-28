import { expectAcceptValuesImpure, expectRejectValues, st } from './helpers'

const numberRt = st.number()
const stringRt = st.string()
const objectRt = st.record({
  a: st.literal('A'),
  b: st.boolean(),
  c: st.integer(),
})
const unknownRt = st.unknown()

describe('json', () => {
  it('accepts json number', () => {
    expectAcceptValuesImpure(
      st.json(numberRt),
      [
        ['1', 1],
        ['2', 2],
        ['-23', -23],
        ['0', 0],
        ['123456789', 123456789],
      ],
      true,
    )
  })

  it('accepts json string', () => {
    expectAcceptValuesImpure(
      st.json(stringRt),
      [
        ['"abc"', 'abc'],
        ['""', ''],
        ['"true"', 'true'],
      ],
      true,
    )
  })

  it('accepts json object', () => {
    expectAcceptValuesImpure(
      st.json(objectRt),
      [
        ['{"a":"A", "b":false, "c":42}', { a: 'A', b: false, c: 42 }],
        [
          `{"a":"A", "b":true, "c":${Number.MAX_SAFE_INTEGER}}`,
          { a: 'A', b: true, c: Number.MAX_SAFE_INTEGER },
        ],
      ],
      true,
    )
  })

  it('rejects non-json', () => {
    expectRejectValues(
      st.json(unknownRt),
      [
        NaN,
        1.1,
        0.0001,
        Infinity,
        '#1#23',
        '{]',
        'abc',
        "'abc'",
        [],
        new Error(),
        undefined,
        null,
        { a: 1 },
        Number.MAX_SAFE_INTEGER + 1,
        Number.MIN_SAFE_INTEGER - 1,
      ],
      'expected a json string',
    )
  })
})
