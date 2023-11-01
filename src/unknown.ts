import { setupInternalRuntype, Runtype } from './runtype'

/**
 * A value to check later.
 */
export function unknown(): Runtype<unknown> {
  return setupInternalRuntype(
    (v) => {
      return v
    },
    { isPure: true },
  )
}
