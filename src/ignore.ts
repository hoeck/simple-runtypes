import { internalRuntype, Runtype } from './runtype'

export type Meta = Readonly<{ type: 'ignore'; isPure: true }>

const meta: Meta = { type: 'ignore', isPure: true }
const ignoreRuntype = internalRuntype(() => {
  return undefined as unknown
}, meta)

/**
 * A value to ignore (typed as unknown and always set to undefined).
 */
export function ignore(): Runtype<unknown> {
  return ignoreRuntype
}

export function toSchema(): string {
  return 'any'
}
