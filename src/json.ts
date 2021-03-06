import {
  createFail,
  InternalRuntype,
  internalRuntype,
  isFail,
  propagateFail,
  Runtype,
} from './runtype'
import { use } from './custom'

export const jsonRuntype = internalRuntype<unknown>((v, failOrThrow) => {
  if (!(typeof v === 'string')) {
    return createFail(failOrThrow, 'expected a json string', v)
  }

  try {
    const jsonData = JSON.parse(v)
    return jsonData
  } catch (err) {
    return createFail(failOrThrow, 'expected a json string: ' + String(err), v)
  }
}, true)

/**
 * A String that is valid json
 */
export function json<T>(rt: Runtype<any>): Runtype<T> {
  return internalRuntype<T>((v, failOrThrow) => {
    const n = (jsonRuntype as InternalRuntype)(v, failOrThrow)

    if (isFail(n)) {
      return propagateFail(failOrThrow, n, v)
    }

    const validationResult = use(rt, n)

    if (!validationResult.ok) {
      return propagateFail(failOrThrow, validationResult.error, v)
    }

    return validationResult.result
  }, true)
}
