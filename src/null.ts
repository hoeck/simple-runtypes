import { createFail, internalRuntype, Runtype } from './runtype'

export type Meta = Readonly<{ type: 'null'; isPure: true }>
const meta: Meta = { type: 'null', isPure: true }
const nullRt = internalRuntype<null>((v, failOrThrow) => {
  if (v !== null) {
    return createFail(failOrThrow, 'expected null', v)
  }

  return v
}, meta)

/**
 * null
 */
// eslint-disable-next-line no-shadow-restricted-names
function nullRuntype(): Runtype<null> {
  return nullRt
}

export { nullRuntype as null }

export function toSchema(): string {
  return 'null'
}
