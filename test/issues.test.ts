import { st } from './helpers'

describe('github issues', () => {
  it('#100 (1)', () => {
    expect(
      st.use(
        st.partial(
          st.record({ name: st.string({ trim: false }), other: st.string() }),
        ),
        {},
      ),
    ).toEqual({ ok: true, result: {} })

    expect(
      st.use(
        st.partial(
          st.record({ name: st.string({ trim: true }), other: st.string() }),
        ),
        {},
      ),
    ).toEqual({ ok: true, result: {} })
  })

  it('#100 (2)', () => {
    const s = st.string({ trim: true, minLength: 1, maxLength: 3 })

    expect(() => s(' ')).toThrow()
    expect(s('abc ')).toEqual('abc')
  })
})
