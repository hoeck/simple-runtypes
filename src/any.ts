import { Runtype, internalRuntype } from './runtype'

/**
 * A value to check later.
 */
export function any(): Runtype<any> {
  return internalRuntype((v) => {
    return v as any
  }, true)
}
