import { st } from './helpers'

describe('getFormattedError', () => {
  it('should return the correctly formatted error string', () => {
    const recordResult = st.use(
      st.record({
        a: st.integer(),
        b: st.string(),
      }),
      {
        a: 1,
        b: 'foo',
        c: 'not-in-record-definition',
      },
    )

    if (recordResult.ok === true) {
      throw new Error()
    }

    expect(st.getFormattedError(recordResult.error)).toEqual(
      'invalid keys in record: ["c"] at `<value>` for `{"a":1,"b":"foo","c":"not-in-record-definition"}`',
    )

    const nestedRecordResult = st.use(
      st.record({
        a: st.integer(),
        d: st.record({
          e: st.string(),
        }),
      }),
      { a: 1, d: { e: 'foo', f: 'not-in-record-definition' } },
    )

    if (nestedRecordResult.ok === true) {
      throw new Error()
    }

    expect(st.getFormattedError(nestedRecordResult.error)).toEqual(
      'invalid keys in record: ["f"] at `<value>.d` for `{"e":"foo","f":"not-in-record-definition"}`',
    )
  })

  it('should work on exception-errors', () => {
    const runtype = st.record({
      a: st.integer(),
      b: st.string(),
    })

    try {
      runtype({
        a: 1,
        b: 'foo',
        c: 'not-in-record-definition',
      })
      expect(true).toBe(false)
    } catch (e) {
      if (st.isRuntypeError(e)) {
        expect(st.getFormattedError(e)).toEqual(
          'RuntypeError: invalid keys in record: ["c"] at `<value>` for `{"a":1,"b":"foo","c":"not-in-record-definition"}`',
        )
      } else {
        throw e
      }
    }
  })
})
