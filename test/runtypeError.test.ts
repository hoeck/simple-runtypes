import { st } from './helpers'

describe('getFormattedError', () => {
  it('should return the correctly formatted error string', () => {
    const recordResult: any = st.use(
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
    expect(st.getFormattedError(recordResult.error)).toEqual(
      'invalid keys in record: ["c"] at `<value>` for `{"a":1,"b":"foo","c":"not-in-record-definition"}`',
    )

    const nestedRecordResult: any = st.use(
      st.record({
        a: st.integer(),
        d: st.record({
          e: st.string(),
        }),
      }),
      { a: 1, d: { e: 'foo', f: 'not-in-record-definition' } },
    )
    expect(st.getFormattedError(nestedRecordResult.error)).toEqual(
      'invalid keys in record: ["f"] at `<value>.d` for `{"e":"foo","f":"not-in-record-definition"}`',
    )
  })
})
