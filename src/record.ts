import { objectRuntype } from './object'
import {
  createFail,
  failSymbol,
  InternalRuntype,
  internalRuntype,
  isFail,
  isPureRuntype,
  propagateFail,
  Runtype,
} from './runtype'
import { debugValue } from './runtypeError'

/**
 * An object with defined keys and values.
 */
function internalRecord<T extends object>(
  typemap: { [K in keyof T]: Runtype<T[K]> },
  sloppy: boolean,
): Runtype<T> {
  const isPure = Object.values(typemap).every((t: any) => isPureRuntype(t))
  const copyObject = sloppy || !isPure

  const rt: Runtype<T> = internalRuntype((v, failOrThrow) => {
    const o: any = (objectRuntype as InternalRuntype)(v, failOrThrow)

    if (isFail(o)) {
      return propagateFail(failOrThrow, o, v)
    }

    // optimize allocations: only create a copy if any of the key runtypes
    // return a different object - otherwise return value as is
    const res = copyObject ? ({} as T) : (o as T)

    for (const k in typemap) {
      // nested types should always fail with explicit `Fail` so we can add additional data
      const value = (typemap[k] as InternalRuntype)(o[k], failSymbol)

      if (isFail(value)) {
        return propagateFail(failOrThrow, value, v, k)
      }

      if (copyObject) {
        res[k] = value
      }
    }

    if (!sloppy) {
      const unknownKeys = Object.keys(o).filter(
        (k) => !Object.prototype.hasOwnProperty.call(typemap, k),
      )

      if (unknownKeys.length) {
        return createFail(
          failOrThrow,
          `invalid keys in record ${debugValue(unknownKeys)}`,
          v,
        )
      }
    }

    return res
  }, isPure)

  // fields metadata to implement combinators like (discriminated) unions,
  // pick, omit and intersection
  const fields: { [key: string]: any } = {}

  for (const k in typemap) {
    fields[k] = typemap[k]
  }

  // eslint-disable-next-line no-extra-semi
  ;(rt as any).fields = fields

  return rt
}

export function getRecordFields(
  r: Runtype<any>,
): { [key: string]: Runtype<any> } | undefined {
  const anyRt: any = r

  if (!anyRt.fields) {
    return
  }

  return anyRt.fields
}

export function record<T extends object>(
  typemap: { [K in keyof T]: Runtype<T[K]> },
): Runtype<T> {
  return internalRecord(typemap, false)
}

export function sloppyRecord<T extends object>(
  typemap: { [K in keyof T]: Runtype<T[K]> },
): Runtype<T> {
  return internalRecord(typemap, true)
}
