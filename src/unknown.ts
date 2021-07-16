import { internalRuntype, Runtype } from './runtype'

export type Meta = Readonly<{ type: 'unknown'; isPure: true }>
const meta: Meta = { type: 'unknown', isPure: true }

/**
 * A value to check later.
 */
export function unknown(): Runtype<unknown> {
  return internalRuntype((v) => {
    return v
  }, meta)
}

export function toSchema(): string {
  return 'any'
}
