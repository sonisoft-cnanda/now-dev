import { describe, it, expect } from '@jest/globals';
import { CSRFTokenHelper } from '../../../src/util/CSRFTokenHelper';

describe('CSRFTokenHelper', () => {

    describe('extractCSRFToken', () => {
        it('should extract token with standard attribute order', () => {
            const html = '<input name="sysparm_ck" type="hidden" value="abc123token456">';
            expect(CSRFTokenHelper.extractCSRFToken(html)).toBe('abc123token456');
        });

        it('should extract token when id attribute is present between name and type', () => {
            const html = '<input name="sysparm_ck" id="sysparm_ck" type="hidden" value="token_with_extra_attrs">';
            expect(CSRFTokenHelper.extractCSRFToken(html)).toBe('token_with_extra_attrs');
        });

        it('should extract token from a large HTML page', () => {
            const html = `
                <html><body>
                <form>
                    <input name="other_field" type="text" value="foo">
                    <input name="sysparm_ck" type="hidden" value="realtoken789">
                    <input type="submit" value="Submit">
                </form>
                </body></html>
            `;
            expect(CSRFTokenHelper.extractCSRFToken(html)).toBe('realtoken789');
        });

        it('should return null when sysparm_ck is not present', () => {
            const html = '<input name="other_field" type="hidden" value="notthetoken">';
            expect(CSRFTokenHelper.extractCSRFToken(html)).toBeNull();
        });

        it('should return null for empty string', () => {
            expect(CSRFTokenHelper.extractCSRFToken('')).toBeNull();
        });

        it('should return null for null/undefined input', () => {
            expect(CSRFTokenHelper.extractCSRFToken(null as any)).toBeNull();
            expect(CSRFTokenHelper.extractCSRFToken(undefined as any)).toBeNull();
        });

        it('should extract token with extra whitespace in attributes', () => {
            const html = '<input name="sysparm_ck"  type="hidden"  value="spaced_token">';
            expect(CSRFTokenHelper.extractCSRFToken(html)).toBe('spaced_token');
        });

        it('should extract only the first token if multiple sysparm_ck inputs exist', () => {
            const html = `
                <input name="sysparm_ck" value="first_token">
                <input name="sysparm_ck" value="second_token">
            `;
            expect(CSRFTokenHelper.extractCSRFToken(html)).toBe('first_token');
        });
    });
});
