import * as sr from '../src'

// private imports
import { failSymbol } from '../src/runtype'

export function expectAcceptValuesImpure<T>(
  rt: sr.Runtype<T>,
  values: unknown[],
): void {
  values.forEach((v) => {
    // use internal call protocol so that it does not raise but return sth
    // that can be reported by jest
    expect((rt as any)(v, failSymbol)).toEqual(v)
    expect((rt as any)(v, failSymbol)).not.toBe(v)
  })
}

export function expectAcceptValuesPure<T>(
  rt: sr.Runtype<T>,
  values: unknown[],
): void {
  values.forEach((v) => {
    // use internal call protocol so that it does not raise but return sth
    // that can be reported by jest
    expect((rt as any)(v, failSymbol)).toBe(v)
  })
}

export function expectRejectValues<T>(
  rt: sr.Runtype<T>,
  values: unknown[],
  error?: string | RegExp,
): void {
  // when using them internally, they return a Fail
  values.forEach((v) => {
    expect(() => (rt as any)(v, failSymbol)).not.toThrow()
    expect((rt as any)(v, failSymbol)).toEqual({
      [failSymbol]: true,
      reason: expect.any(String),
      path: expect.any(Array),
    })
  })

  // when using runtypes as a normal user, they respond with throwing errors
  values.forEach((v) => {
    expect(() => rt(v)).toThrow(error || /.*/)
  })

  // when passing something that is not a failSymbol or undefined, they
  // respond with a usage error
  expect(() => (rt as any)(Symbol('wrong'), null)).toThrow(
    /failOrThrow must be undefined or the failSymbol/,
  )
  expect(() => (rt as any)(Symbol('wrong'), 0)).toThrow(
    /failOrThrow must be undefined or the failSymbol/,
  )
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
  rt: sr.Runtype<any>,
  error?: string | RegExp,
): void {
  objectAttributes.forEach((a) => {
    expect(() => rt(a)).toThrow(error || /.*/)
  })
}
