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
 * An index with string keys.
 */
export function stringIndex<T>(t: Runtype<T>): Runtype<{ [key: string]: T }> {
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

      const value = (t as InternalRuntype)(o[k], failSymbol)

      if (isFail(value)) {
        return propagateFail(failOrThrow, value, v, k)
      }

      if (!isPure) {
        res[k] = value
      }
    }

    return res
  }, isPure)
}
