import { createFail, internalRuntype, Runtype } from './runtype'
import { debugValue } from './runtypeError'

type EnumObject = { [key: string]: string | number }
export type Meta = Readonly<{
  type: 'enum'
  isPure: true
  enumObject: EnumObject
}>

/**
 * Any value defined in the enumObject.
 */
function enumRuntype<T extends EnumObject, S extends keyof T>(
  enumObject: T,
): Runtype<T[S]> {
  const meta: Meta = { type: 'enum', isPure: true, enumObject }
  return internalRuntype((v, failOrThrow) => {
    // use the fast reverse lookup of number enums to check whether v is a
    // value of the enum
    if (typeof v === 'number' && (enumObject as any)[v as any] !== undefined) {
      return (v as unknown) as T[S]
    }

    if (Object.values(enumObject).indexOf(v as any) !== -1) {
      return v as T[S]
    }

    return createFail(
      failOrThrow,
      `expected a value that belongs to the enum ${debugValue(enumObject)}`,
      v,
    )
  }, meta)
}

export { enumRuntype as enum }

export function toSchema(runtype: Runtype<any>): string {
  const meta: Meta = (runtype as any).meta
  const keys = Object.keys(meta.enumObject)

  return keys.map((k) => JSON.stringify(k)).join(' | ')
}
