import {
  createFail,
  failSymbol,
  InternalRuntype,
  internalRuntype,
  isFail,
  isPureRuntype,
  propagateFail,
  Runtype,
  OptionalRuntype,
  Collapse,
  Unpack,
} from './runtype'
import { debugValue } from './runtypeError'
import type { Meta as RuntypeMeta } from './runtypeMeta'

export type Meta = Readonly<{
  type: 'record'
  isPure: boolean
  fields: { [key: string]: Runtype<any> }
}>

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

function internalRecord(
  typemap: { [key: string]: Runtype<any> | OptionalRuntype<any> },
  sloppy: boolean,
): Runtype<any> {
  // fields metadata to implement combinators like (discriminated) unions,
  // pick, omit and intersection
  const fields: Meta['fields'] = {}

  for (const k in typemap) {
    fields[k] = typemap[k]
  }

  const meta: Meta = { type: 'record', isPure: isPureTypemap(typemap), fields }
  const copyObject = sloppy || !meta.isPure

  // cache typemap in arrays for a faster loop
  const typemapKeys = [...Object.keys(typemap)]
  const typemapValues = [...Object.values(typemap)]

  return internalRuntype((v, failOrThrow) => {
    // inlined object runtype for perf
    if (typeof v !== 'object' || Array.isArray(v) || v === null) {
      return createFail(failOrThrow, 'expected an object', v)
    }

    const o: any = v

    // optimize allocations: only create a copy if any of the key runtypes
    // return a different object - otherwise return value as is
    const res = copyObject ? {} : o

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

      if (copyObject) {
        res[k] = value
      }
    }

    if (!sloppy) {
      const unknownKeys: string[] = []

      for (const k in o) {
        if (!Object.prototype.hasOwnProperty.call(typemap, k)) {
          unknownKeys.push(o)
        }
      }

      if (unknownKeys.length) {
        return createFail(
          failOrThrow,
          `invalid keys in record ${debugValue(unknownKeys)}`,
          v,
        )
      }
    }

    return res
  }, meta)
}

export function getRecordFields(r: Runtype<any>): Meta['fields'] | undefined {
  const meta: Meta = (r as any).meta

  if (meta.type !== 'record') {
    return
  }

  return meta.fields
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
  return internalRecord(typemap as any, false)
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

export function toSchema(
  runtype: Runtype<any>,
  runtypeToSchema: (runtype: Runtype<any>) => string,
): string {
  const meta: Meta = (runtype as any).meta

  return `{\n  ${Object.entries(meta.fields)
    .map(([k, v]) => {
      const vMeta: RuntypeMeta = (v as any).meta
      const isOptional = vMeta.type === 'optional'
      const optionalSymbol = isOptional ? '?' : ''

      return `${k}${optionalSymbol}: ${runtypeToSchema(v)};`
    })
    .join('\n  ')}\n}`
}
