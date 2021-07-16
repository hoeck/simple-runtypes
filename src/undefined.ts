import { createFail, internalRuntype, Runtype } from './runtype'

export type Meta = Readonly<{ type: 'undefined'; isPure: true }>
const meta: Meta = { type: 'undefined', isPure: true }

/**
 * undefined
 */
// eslint-disable-next-line no-shadow-restricted-names
function undefinedRuntype(): Runtype<undefined> {
  return internalRuntype<undefined>((v, failOrThrow) => {
    if (v !== undefined) {
      return createFail(failOrThrow, 'expected undefined', v)
    }

    return v
  }, meta)
}

export { undefinedRuntype as undefined }

export function toSchema(): string {
  return 'never'
}
