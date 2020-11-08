import * as st from '../src'

// // re-export so tests don't depend on the weird src directory
export * as st from '../src'

// impure: the value returned by the runtype must have been modified in-place
// and thus its a new value
export function expectAcceptValuesImpure<T>(
  rt: st.Runtype<T>,
  values: unknown[],
): void {
  values.forEach((v) => {
    const result = st.use(rt, v)

    expect(result).toEqual({ ok: true, result: v })
    expect(result.ok && result.result).not.toBe(v)

    // check both, the error throwing api and the wrapped-result returning
    // one but only expect on the wrapped-result one bc its easier to report with jest
    expect(() => rt(v)).not.toThrow()
  })
}

// pure: the value returned by the runtype must *not* have been modified and
// is exactly the same value
export function expectAcceptValuesPure<T>(
  rt: st.Runtype<T>,
  values: unknown[],
): void {
  values.forEach((v) => {
    const result = st.use(rt, v)

    expect(result).toEqual({ ok: true, result: v })
    expect(result.ok && result.result).toBe(v)

    expect(() => rt(v)).not.toThrow()
  })
}

export function expectRejectValues<T>(
  rt: st.Runtype<T>,
  values: unknown[],
  error?: string | RegExp,
): void {
  // use with an explicit validation result
  values.forEach((v) => {
    const result = st.use(rt, v)

    expect(result).toEqual({
      ok: false,
      error: expect.any(Object),
    })

    expect(result.ok === false && st.getFormattedError(result.error)).toMatch(
      error || /.*/,
    )
  })

  // use with exceptions
  values.forEach((v) => {
    expect(() => rt(v)).toThrow(error || /.*/)
  })
}

// properties defined on all js objects,
// need ensure that we're not silently accepting them anywhere
export const objectAttributes = [
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  '__proto__',
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
]

export function expectRejectObjectAttributes(
  rt: st.Runtype<any>,
  error?: string | RegExp,
): void {
  objectAttributes.forEach((a) => {
    const result = st.use(rt, a)
    expect(result).toEqual({
      ok: false,
      error: expect.any(Object),
    })

    expect(result.ok === false && st.getFormattedError(result.error)).toMatch(
      error || /.*/,
    )

    expect(() => rt(a)).toThrow(error || /.*/)
  })
}
