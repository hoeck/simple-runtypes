import {
  Collapse,
  createFail,
  failSymbol,
  getRuntypeMetadata,
  InternalRuntype,
  isFail,
  OptionalRuntype,
  propagateFail,
  Runtype,
  setupInternalRuntype,
  Unpack,
} from './runtype'
import { debugValue } from './runtypeError'

function isPureTypemap(typemapValues: (Runtype<any> | OptionalRuntype<any>)[]) {
  for (let i = 0; i < typemapValues.length; i++) {
    const m = getRuntypeMetadata(typemapValues[i])

    if (!m.isPure) {
      return false
    }
  }

  return true
}

export function internalRecord(
  typemap: {
    [key: string]: Runtype<any> | OptionalRuntype<any>
  },
  isNonStrict?: boolean,
): Runtype<any> {
  // cache typemap in arrays for a faster loop
  const typemapKeys = [...Object.keys(typemap)]
  const typemapValues = [...Object.values(typemap)] as InternalRuntype<any>[]

  // a nonStrict record may ignore keys and so cannot be pure
  const isPure = !isNonStrict && isPureTypemap(typemapValues)

  return setupInternalRuntype(
    (v, failOrThrow) => {
      // inlined object runtype for perf
      if (typeof v !== 'object' || Array.isArray(v) || v === null) {
        return createFail(failOrThrow, 'expected an object', v)
      }

      const o: any = v

      // optimize allocations: only create a copy if the record is impure
      const res = isPure ? o : {}

      for (let i = 0; i < typemapKeys.length; i++) {
        const k = typemapKeys[i]
        const t = typemapValues[i] as InternalRuntype<any>

        // optional fields not present in the given object do not need to be
        // checked at all
        // this is vital to preserve the object shape of an impure record
        // with optional fields
        if (t.meta?.optional && !o.hasOwnProperty(k)) {
          break
        }

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
    },
    {
      isPure,
      fields: typemap,
      isNonStrict,
    },
  )
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
