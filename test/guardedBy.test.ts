import { expectAcceptValuesPure, expectRejectValues, st } from './helpers'
import { failSymbol } from '../src/runtype'

describe('guardedBy', () => {
  const guard = (v: unknown): v is string => typeof v === 'string'
  const runtype = st.guardedBy(guard)

  it('accepts valid values', () => {
    expectAcceptValuesPure(runtype, ['a', 'aa', ''])
  })

  it('rejects invalid values', () => {
    expectRejectValues(runtype, [null, undefined, 0, [], {}])
  })
})

describe('guardedBy with base runtype', () => {
  type EvenIntStr = string & { _: never }
  const guard = (
    originalValue: unknown,
    baseRuntypeValue: number,
  ): originalValue is EvenIntStr => baseRuntypeValue % 2 === 0
  const runtype = st.guardedBy(guard, st.stringAsInteger())

  it('accepts valid values', () => {
    expectAcceptValuesPure(runtype, ['42', '-42', '0'])
  })

  it('rejects invalid values', () => {
    expectRejectValues(runtype, [
      '22i',
      '23',
      '-23',
      22,
      23,
      null,
      undefined,
      0,
      [],
      {},
    ])
  })

  it('should not throw an exception when used internally', () => {
    expect((runtype as any)(123, failSymbol)).toEqual(
      // thrown by base runtype
      expect.objectContaining({
        reason: 'expected a string that contains a safe integer',
      }),
    )

    expect((runtype as any)('-123', failSymbol)).toEqual(
      // thrown by custom runtype
      expect.objectContaining({
        reason: 'expected typeguard to return true',
      }),
    )
  })

  it('should throw an exception when used externally', () => {
    expect(() => runtype(123)).toThrow(
      // thrown by base runtype - value is the raw input value
      expect.objectContaining({
        message: 'expected a string that contains a safe integer',
        value: 123,
      }),
    )

    expect(() => runtype('122i')).toThrow(
      // thrown by base runtype - value is the raw input value
      expect.objectContaining({
        message:
          'expected string to contain only the safe integer, not additional characters, whitespace or leading zeros',
        value: '122i',
      }),
    )

    expect(() => runtype('-123')).toThrow(
      // thrown by guarded runtype - value is the return value of base runtyoe
      expect.objectContaining({
        message: 'expected typeguard to return true',
        value: -123,
      }),
    )
  })
})
