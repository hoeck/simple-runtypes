import { RuntypeError, Fail } from './runtype'

type RuntypeErrorInfo = RuntypeError | Fail

/**
 * Turn an arbitrary object into a string of max length suitable for logging.
 */
export function debugValue(v: unknown, maxLength = 512): string {
  let s: string

  if (v === undefined) {
    return 'undefined'
  }

  try {
    s = JSON.stringify(v)
  } catch {
    s = `${v}`
  }

  if (s.length > maxLength) {
    return s.slice(0, maxLength - 1) + '\u2026'
  } else {
    return s
  }
}

/**
 * Return the object path at which the error occured.
 */
export function getFormattedErrorPath(e: RuntypeErrorInfo): string {
  if (!Array.isArray(e.path)) {
    return '(error is not a RuntypeError!)'
  }

  // path in Fail objects is with the root-element at the end bc. its easier
  // to build it that way (just an [].push)
  const pathInRootElementFirstOrder = [...e.path].reverse()

  return pathInRootElementFirstOrder
    .map((k) =>
      typeof k === 'number'
        ? `[${k}]`
        : /^\w+$/.test(k)
        ? `.${k}`
        : `['${JSON.stringify(k)}']`,
    )
    .join('')
    .slice(1)
}

/**
 * Return a string representaiton of the value that failed the runtype check.
 *
 * Cap the size of the returned string at maxLength
 */
export function getFormattedErrorValue(
  e: RuntypeErrorInfo,
  maxLength = 512,
): string {
  return debugValue(e.value, maxLength)
}

/**
 * Return a string representation of the value that failed the runtype check.
 *
 * Cap the size of the returned string at maxLength
 */
export function getFormattedError(
  e: RuntypeErrorInfo,
  maxLength = 512,
): string {
  const rawPath = getFormattedErrorPath(e)
  const path = rawPath ? `<value>.${rawPath}` : '<value>'
  const label = 'name' in e ? `${e.name}: ` : ''
  const value = getFormattedErrorValue(e, maxLength)

  return `${label}${e.reason} at \`${path}\` in \`${value}\``
}
