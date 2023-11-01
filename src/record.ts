import {
  createFail,
  failSymbol,
  InternalRuntype,
  setupInternalRuntype,
  isFail,
  isPureRuntype,
  propagateFail,
  Runtype,
  OptionalRuntype,
  Collapse,
  Unpack,
  isNonStrictRuntypeSymbol,
} from './runtype'
import { debugValue } from './runtypeError'

function isPureTypemap(typemap: object) {
  for (const k in typemap) {
    if (!Object.prototype.hasOwnProperty.call(typemap, k)) {
      continue
    }

    if (!isPureRuntype(typemap[k as keyof typeof typemap])) {
      return false
    }
  }

  return true
}

export function internalRecord(
  typemap: {
    [key: string]: Runtype<any> | OptionalRuntype<any>
  },
  isNonStrict = false,
): Runtype<any> {
  // a nonStrict record may ignore keys and so cannot be pure
  const isPure = !isNonStrict && isPureTypemap(typemap)

  // cache typemap in arrays for a faster loop
  const typemapKeys = [...Object.keys(typemap)]
  const typemapValues = [...Object.values(typemap)]

  const rt = setupInternalRuntype((v, failOrThrow) => {
    // inlined object runtype for perf
    if (typeof v !== 'object' || Array.isArray(v) || v === null) {
      return createFail(failOrThrow, 'expected an object', v)
    }

    const o: any = v

    // optimize allocations: only create a copy if the record is impure
    const res = isPure ? o : {}

    for (let i = 0; i < typemapKeys.length; i++) {
      const k = typemapKeys[i]
      const t = typemapValues[i] as InternalRuntype

      // nested types should always fail with explicit `Fail` so we can add additional data
      const value = t(o[k], failSymbol)

      if (isFail(value)) {
        if (!(k in o)) {
          // rt failed because o[k] was undefined bc. the key was missing from o
          // use a more specific error message in this case
          return createFail(
            failOrThrow,
            `missing key in record: ${debugValue(k)}`,
          )
        }

        return propagateFail(failOrThrow, value, v, k)
      }

      if (!isPure) {
        res[k] = value
      }
    }

    if (!isNonStrict) {
      const unknownKeys: string[] = []

      for (const k in o) {
        if (!Object.prototype.hasOwnProperty.call(typemap, k)) {
          unknownKeys.push(k)
        }
      }

      if (unknownKeys.length) {
        return createFail(
          failOrThrow,
          `invalid keys in record: ${debugValue(unknownKeys)}`,
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

  if (isNonStrict) {
    // eslint-disable-next-line no-extra-semi
    ;(rt as any).isNonStrict = isNonStrictRuntypeSymbol
  }

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

/**
 * An object with defined keys and values.
 *
 * In contrast to typescript types, objects checked by this runtype will fail
 * if they have any additional keys (strict checking) not specified in
 * typemap.
 *
 * Keeps you save from unwanted propertiers and evil __proto__ injections.
 */
export function record<
  T,
  Typemap = { [K in keyof T]: Runtype<T[K]> | OptionalRuntype<T[K]> },
  OptionalKeys extends keyof Typemap = {
    [K in keyof Typemap]: Typemap[K] extends OptionalRuntype<any> ? K : never
  }[keyof Typemap]
>(
  typemap: Typemap,
): Runtype<
  Collapse<
    { [K in Exclude<keyof Typemap, OptionalKeys>]: Unpack<Typemap[K]> } &
      { [K in OptionalKeys]?: Unpack<Typemap[K]> }
  >
> {
  return internalRecord(typemap as any)
}

/**
 * Like record but ignore unknown keys.
 *
 * Returns a new object that only contains the keys specified in the typemap.
 * Additional keys are ignored.
 *
 * Keeps you save from unwanted propertiers and evil __proto__ injections.
 */
export function sloppyRecord<
  T,
  Typemap = { [K in keyof T]: Runtype<T[K]> | OptionalRuntype<T[K]> },
  OptionalKeys extends keyof Typemap = {
    [K in keyof Typemap]: Typemap[K] extends OptionalRuntype<any> ? K : never
  }[keyof Typemap]
>(
  typemap: Typemap,
): Runtype<
  Collapse<
    { [K in Exclude<keyof Typemap, OptionalKeys>]: Unpack<Typemap[K]> } &
      { [K in OptionalKeys]?: Unpack<Typemap[K]> }
  >
> {
  return internalRecord(typemap as any, true)
}
