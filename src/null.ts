import { createFail, internalRuntype, Runtype } from './runtype'

/**
 * null
 */
// eslint-disable-next-line no-shadow-restricted-names
function nullRuntype(): Runtype<null> {
  return internalRuntype<null>((v, failOrThrow) => {
    if (v !== null) {
      return createFail(failOrThrow, 'expected null', v)
    }

    return v
  }, true)
}

export { nullRuntype as null }
