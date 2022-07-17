import {
  expectAcceptValuesImpure,
  expectAcceptValuesPure,
  expectRejectValues,
  st,
} from './helpers'

describe('array', () => {
  it('accepts valid arrays', () => {
    const runtype = st.array(st.number())

    expectAcceptValuesPure(runtype, [[], [1], [1, 2.2, 3.3]])
  })

  it('accepts / rejects arrays with maxLength restrictions', () => {
    const runtype = st.array(st.number(), { maxLength: 2 })

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
    const runtype = st.array(st.number(), { minLength: 2 })

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
    const runtype = st.array(st.number())

    expectRejectValues(runtype, [undefined, null, ['asd'], [undefined, 1], '1'])
  })

  it('deals with impure runtypes', () => {
    const rt = st.array(st.string({ trim: true }))

    expectAcceptValuesImpure(
      rt,
      [
        [[''], ['']],
        [['foo '], ['foo']],
      ],
      true,
    )
  })
})
