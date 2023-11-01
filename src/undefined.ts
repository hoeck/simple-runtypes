import { createFail, setupInternalRuntype, Runtype } from './runtype'

/**
 * undefined
 */
// eslint-disable-next-line no-shadow-restricted-names
function undefinedRuntype(): Runtype<undefined> {
  return setupInternalRuntype<undefined>((v, failOrThrow) => {
    if (v !== undefined) {
      return createFail(failOrThrow, 'expected undefined', v)
    }

    return v
  }, true)
}

export { undefinedRuntype as undefined }
