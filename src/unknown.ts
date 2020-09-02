import { internalRuntype, Runtype } from './runtype'

/**
 * A value to check later.
 */
export function unknown(): Runtype<unknown> {
  return internalRuntype((v) => {
    return v
  }, true)
}
