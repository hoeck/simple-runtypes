import * as sr from '../src'
import { failSymbol } from '../src/runtype'
import {
  expectAcceptValuesPure,
  expectAcceptValuesImpure,
  expectRejectValues,
} from './helpers'

describe('custom runtypes', () => {
  describe('simple nested runtypes', () => {
    const rt = sr.runtype((v) => {
      if (v === 31) {
        return 31
      }

      if (v === '-') {
        return '-'
      }

      return sr.createError('not the right type')
    })

    it('should create a custom runtype', () => {
      expectAcceptValuesPure(rt, ['-', 31])
      expectRejectValues(rt, ['31', null, 123, []])
    })

    it('should not throw an exception when used internally', () => {
      expect((rt as any)(123, failSymbol)).toEqual(
        expect.objectContaining({
          [failSymbol]: true,
          reason: 'not the right type',
        }),
      )
    })
  })

  describe('nested runtypes that combine other runtypes', () => {
    const stringsRt = sr.tuple(sr.literal('3'), sr.literal('1'))
    const combinedRt = sr.runtype((v) => {
      const strings = sr.use(stringsRt, v)

      if (strings.ok) {
        return 31
      }

      if (v === 31) {
        return v
      }

      return sr.createError('not the right type')
    })

    it('should invoke other runtypes', () => {
      expect(combinedRt(31)).toBe(31)
      expect(combinedRt(['3', '1'])).toBe(31)

      expectRejectValues(combinedRt, ['31', null, 123, ['3', '1', '0'], [], {}])
    })
  })

  describe('custom with base runtype', () => {
    const rt = sr.runtype((v) => {
      if (v % 2 !== 0) {
        return sr.createError('no even number')
      }
      return `${typeof v} ${JSON.stringify(v)}`
    }, sr.stringAsInteger())

    it('should create a custom runtype', () => {
      expectAcceptValuesImpure(
        rt,
        [
          ['0', 'number 0'],
          ['-42', 'number -42'],
          ['+42', 'number 42'],
        ],
        true,
      )
      expectRejectValues(rt, [23, '5', null, -24, true, '20i', []])
    })

    it('should not throw an exception when used internally', () => {
      expect((rt as any)(123, failSymbol)).toEqual(
        // thrown by base runtype
        expect.objectContaining({
          reason: 'expected a string that contains a safe integer',
        }),
      )

      expect((rt as any)('-123', failSymbol)).toEqual(
        // thrown by custom runtype
        expect.objectContaining({
          reason: 'no even number',
        }),
      )
    })

    it('should throw an exception when used externally', () => {
      expect(() => rt(123)).toThrow(
        // thrown by base runtype - value is the raw input value
        expect.objectContaining({
          message: 'expected a string that contains a safe integer',
          value: 123,
        }),
      )

      expect(() => rt('122i')).toThrow(
        // thrown by base runtype - value is the raw input value
        expect.objectContaining({
          message:
            'expected string to contain only the safe integer, not additional characters, whitespace or leading zeros',
          value: '122i',
        }),
      )

      expect(() => rt('-123')).toThrow(
        // thrown by custom runtype - value is the return value of base runtyoe
        expect.objectContaining({
          message: 'no even number',
          value: -123,
        }),
      )
    })
  })
})
