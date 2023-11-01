import { Runtype, setupInternalRuntype } from './runtype'

/**
 * A value to check later.
 */
export function any(): Runtype<any> {
  return setupInternalRuntype(
    (v) => {
      return v as any
    },
    { isPure: true },
  )
}
