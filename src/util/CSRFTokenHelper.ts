/**
 * Shared utility for extracting CSRF tokens (sysparm_ck) from ServiceNow HTML pages.
 *
 * ServiceNow embeds CSRF tokens as hidden input fields in `.do` processor pages.
 * The HTML attribute order can vary between pages and platform versions, so a regex
 * approach is more robust than fixed-string substring matching.
 */
export class CSRFTokenHelper {

    /**
     * Extracts the `sysparm_ck` CSRF token value from an HTML string.
     *
     * @param html - Raw HTML response from a ServiceNow `.do` page
     * @returns The token string, or `null` if not found
     */
    static extractCSRFToken(html: string): string | null {
        if (!html) {
            return null;
        }
        const match = html.match(/name="sysparm_ck"[^>]*value="([^"]+)"/);
        return match ? match[1] : null;
    }
}
