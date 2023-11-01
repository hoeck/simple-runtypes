import { use } from './custom'
import {
  createFail,
  InternalRuntype,
  isFail,
  propagateFail,
  Runtype,
  setupInternalRuntype,
} from './runtype'

export const jsonRuntype = setupInternalRuntype<unknown>(
  (v, failOrThrow) => {
    if (!(typeof v === 'string')) {
      return createFail(failOrThrow, 'expected a json string', v)
    }

    try {
      const jsonData = JSON.parse(v)
      return jsonData
    } catch (err) {
      return createFail(
        failOrThrow,
        'expected a json string: ' + String(err),
        v,
      )
    }
  },
  { isPure: false },
)

/**
 * A String that is valid json
 */
export function json<T>(rt: Runtype<T>): Runtype<T> {
  return setupInternalRuntype<any>(
    (v, failOrThrow) => {
      const n = (jsonRuntype as InternalRuntype<any>)(v, failOrThrow)

      if (isFail(n)) {
        return propagateFail(failOrThrow, n, v)
      }

      const validationResult = use(rt, n)

      if (!validationResult.ok) {
        return propagateFail(failOrThrow, validationResult.error, v)
      }

      return validationResult.result
    },
    { isPure: true },
  )
}
