/**
 * Converts any string to kebab case.
 *
 * Example:
 * ```
 * toKebabCase('THEQuick... brown.foxJumps!') === 't-h-e-quick-brown-fox-jumps'
 * ```
 */
export const toKebabCase = (string: string) => (
	string
		.replace(/([A-Z])/g, '-$1')
		.replace(/\W/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.toLowerCase()
);

/** Converts any string to a regular expression string which matches exactly that string. */
export const toPattern = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');