import { createFail, internalRuntype, Runtype } from './runtype'

const booleanRuntype = internalRuntype<boolean>((v, failOrThrow) => {
  if (v === true || v === false) {
    return v
  }

  return createFail(failOrThrow, 'expected a boolean', v)
}, true)

/**
 * A boolean.
 */
export function boolean(): Runtype<boolean> {
  return booleanRuntype
}
