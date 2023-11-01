import { setupInternalRuntype, Runtype } from './runtype'

/**
 * A value to ignore (typed as unknown and always set to undefined).
 */
export function ignore(): Runtype<unknown> {
  return setupInternalRuntype(() => {
    return undefined as unknown
  })
}
