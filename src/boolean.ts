import { createFail, Runtype, setupInternalRuntype } from './runtype'

const booleanRuntype = setupInternalRuntype<boolean>(
  (v, failOrThrow) => {
    if (v === true || v === false) {
      return v
    }

    return createFail(failOrThrow, 'expected a boolean', v)
  },
  { isPure: true },
)

/**
 * A boolean.
 */
export function boolean(): Runtype<boolean> {
  return booleanRuntype
}
