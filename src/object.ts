import { createFail, internalRuntype, Runtype } from './runtype'

// cached object runtype
export const objectRuntype = internalRuntype<object>((v, failOrThrow) => {
  if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
    return v
  }

  return createFail(failOrThrow, 'expected an object', v)
}, true)

/**
 * An object that is not an array.
 */
export function object(): Runtype<object> {
  return objectRuntype
}
