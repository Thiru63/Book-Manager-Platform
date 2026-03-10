/**
 * Sanitize input values to prevent NoSQL injection
 * Removes keys starting with $ (MongoDB operators) and nested dangerous patterns
 */
const sanitizeInput = (value) => {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string') {
        return value.replace(/[${}]/g, '');
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeInput);
    }

    if (typeof value === 'object') {
        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
            if (key.startsWith('$')) continue; // Skip MongoDB operators
            sanitized[key] = sanitizeInput(val);
        }
        return sanitized;
    }

    return value;
};

module.exports = { sanitizeInput };
