import * as sr from '../src'

// test helpers

/**
 * Construct an unknown value
 */
function unknownValue(v: any): unknown {
    return v
}

// test

describe('number', () => {
    it('accepts numbers', () => {
        [123, 0, -0, Infinity, -Infinity, 123e5678].forEach(n => {
            expect(sr.number(n)).toBe(n)
        })
    })

    it('rejects NaN unless allowNaN is true', () => {
        expect(() => sr.number(NaN)).toThrow('expected a number')
        expect(sr.number(NaN, true)).toBeNaN()
    })

    it('rejects non-numbers', () => {
        ['123', '', {}, [], null, undefined].forEach(x => {
            expect(() => sr.number(x)).toThrow('expected a number')
        })
    })
})

describe('integer', () => {
    it('accepts integers', () => {
        [1,2,0,123456789, Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER].forEach(n => {
            expect(sr.integer(n)).toBe(n)
        })
    })

    it('rejects non-integers', () => {
        [NaN, 1.1, 0.0001, Infinity, '123', [], undefined, null, {a: 1}].forEach(x => {
            expect(() => sr.integer(x)).toThrow('expected an integer')
        })
    })
})

describe('string', () => {
    it('accepts strings', () => {
        expect(sr.string('asdf')).toBe('asdf')
        expect(sr.string('')).toBe('')
    })

    it('rejects non-strings', () => {
        [123, [], /asd/, undefined, null].forEach(v => {
            expect(() => sr.string(v)).toThrow('expected a string')
        })
    })
})

describe('literal', () => {
    type stringLiteral = 'foo'
    type numberLiteral = 12
    type booleanLiteral = true

    it('accepts a string literal', () => {
        const res: stringLiteral = sr.literal(unknownValue('foo'), 'foo')

        expect(res).toBe('foo')
    })

    it('accepts a number literal', () => {
        const res: numberLiteral = sr.literal(unknownValue(12), 12)

        expect(res).toBe(12)
    })

    it('accepts a boolean literal', () => {
        const res: booleanLiteral = sr.literal(unknownValue(true), true)

        expect(res).toBe(true)
    })

    it('rejects invalid literals', () => {
        ['bar', null, {}, undefined, 0].forEach(v => {
            expect(() => sr.literal(v, 'foo')).toThrow('expected a literal')
        })
    })
})

describe('enumValue', () => {
    enum NumericEnum {
        FOO_ONE = 1,
        BAR_TWO,
        BAZ_THREE
    }

    enum StringEnum {
        FOO = 'foo',
        BAR = 'bar',
        BAZ = 'baz',
    }

    it('accepts any enum value', () => {
        expect(sr.enumValue(NumericEnum.BAR_TWO, NumericEnum)).toBe(NumericEnum.BAR_TWO)
        expect(sr.enumValue(2, NumericEnum)).toBe(NumericEnum.BAR_TWO)

        expect(sr.enumValue(StringEnum.BAR, StringEnum)).toBe(StringEnum.BAR)
        expect(sr.enumValue('baz', StringEnum)).toBe(StringEnum.BAZ)
    })

    it('rejects non-enum values', () => {
        expect(() => sr.enumValue(4, NumericEnum)).toThrow('expected a value')
        expect(() => sr.enumValue('123', StringEnum)).toThrow('expected a value')
    })
})
