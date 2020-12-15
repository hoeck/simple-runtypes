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
 * Return boolean to indicate whether passed object seems to be an RuntypeError
 */
function isRuntypeErrorPath(e: RuntypeErrorInfo): boolean {
  return Array.isArray(e.path)
}

/**
 * Return the object path at which the error occured.
 */
export function getFormattedErrorPath(e: RuntypeErrorInfo): string {
  if (!isRuntypeErrorPath(e)) {
    return '(error is not a RuntypeError!)'
  }

  // path in Fail objects is with the root-element at the end bc. its easier
  // to build it that way (just an [].push)
  const pathInRootElementFirstOrder = [...e.path].reverse()

  const formattedErrorPath = pathInRootElementFirstOrder
    .map((k) =>
      typeof k === 'number'
        ? `[${k}]`
        : /^\w+$/.test(k)
        ? `.${k}`
        : `['${JSON.stringify(k)}']`,
    )
    .join('')

  return formattedErrorPath.startsWith('.')
    ? formattedErrorPath.slice(1)
    : formattedErrorPath
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
  if (!isRuntypeErrorPath(e)) {
    return '(error is not a RuntypeError!)'
  }

  const { value: resolvedValue } = e.path.reduceRight(
    ({ value, isResolvable }, key) => {
      // we have not not been able to resolve the value previously - don't try any further
      if (!isResolvable) {
        return { value, isResolvable }
      }

      // try to resolve key within objects or arrays
      if (key in value) {
        return { value: value[key], isResolvable }
      }

      // otherwise return last value successfully resolved and mark as "not further resolvable"
      return { value, isResolvable: false }
    },
    { value: e.value, isResolvable: true },
  )

  return debugValue(resolvedValue, maxLength)
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
