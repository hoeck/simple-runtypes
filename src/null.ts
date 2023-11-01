import { createFail, setupInternalRuntype, Runtype } from './runtype'

/**
 * null
 */
// eslint-disable-next-line no-shadow-restricted-names
function nullRuntype(): Runtype<null> {
  return setupInternalRuntype<null>(
    (v, failOrThrow) => {
      if (v !== null) {
        return createFail(failOrThrow, 'expected null', v)
      }

      return v
    },
    { isPure: true },
  )
}

export { nullRuntype as null }
