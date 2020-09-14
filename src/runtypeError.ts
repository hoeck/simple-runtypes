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
 * Thrown if the input does not match the runtype.
 *
 * Use `getFormattedErrorPath`, `getFormattedErrorValue` and
 * `getFormattedError` to convert path and value to a loggable string.
 */
export class RuntypeError extends Error {
  readonly path?: (string | number)[]
  readonly value?: any

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(message: string, value?: any, path?: (string | number)[]) {
    super(message)

    this.name = 'RuntypeError'
    this.path = path
    this.value = value
  }
}

/**
 * Return the object path at which the error occured.
 */
export function getFormattedErrorPath(e: RuntypeError): string {
  if (!Array.isArray(e.path)) {
    return '(error is not a RuntypeError!)'
  }

  return e.path
    .map((k) =>
      typeof k === 'number'
        ? `[${k}]`
        : /^([A-z0-9_])+$/.test(k)
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
  e: RuntypeError,
  maxLength = 512,
): string {
  return debugValue(e.value, maxLength)
}

/**
 * Return a string representation of the value that failed the runtype check.
 *
 * Cap the size of the returned string at maxLength
 */
export function getFormattedError(e: RuntypeError, maxLength = 512): string {
  const rawPath = getFormattedErrorPath(e)
  const path = rawPath ? `<value>.${rawPath}` : '<value>'

  return `${e.toString()} at \`${path}\` in \`${getFormattedErrorValue(
    e,
    maxLength,
  )}\``
}

/**
 * Thrown if the api is misused.
 */
export class RuntypeUsageError extends Error {}
