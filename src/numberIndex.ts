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
import { stringAsIntegerRuntype } from './stringAsInteger'

/**
 * An index with number keys.
 */
export function numberIndex<T>(t: Runtype<T>): Runtype<{ [key: number]: T }> {
  const isPure = isPureRuntype(t)

  return internalRuntype<any>((v, failOrThrow) => {
    const o: any = (objectRuntype as InternalRuntype)(v, failOrThrow)

    if (isFail(o)) {
      return propagateFail(failOrThrow, o, v)
    }

    if (Object.getOwnPropertySymbols(o).length) {
      return createFail(
        failOrThrow,
        `invalid key in stringIndex: ${debugValue(
          Object.getOwnPropertySymbols(o),
        )}`,
        v,
      )
    }

    const res: { [key: string]: T } = isPure ? o : {}

    for (const k in o) {
      if (k === '__proto__') {
        // e.g. someone tried to sneak __proto__ into this object and that
        // will cause havoc when assigning it to a new object (in case its impure)
        return createFail(
          failOrThrow,
          `invalid key in stringIndex: ${debugValue(k)}`,
          v,
        )
      }

      const key = (stringAsIntegerRuntype as InternalRuntype)(k, failOrThrow)

      if (isFail(key)) {
        return propagateFail(failOrThrow, key, v)
      }

      const value = (t as InternalRuntype)(o[key], failSymbol)

      if (isFail(value)) {
        return propagateFail(failOrThrow, value, v, key)
      }

      if (!isPure) {
        res[key] = value
      }
    }

    return res
  }, true)
}
