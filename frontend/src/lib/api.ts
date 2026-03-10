const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function apiFetch(endpoint: string, options?: RequestInit) {
    const url = `${API_URL}${endpoint}`;

    const res = await fetch(url, {
        ...options,
        credentials: 'include', // Send cookies with every request
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    // If access token expired, try to refresh
    if (res.status === 401 && !endpoint.includes('/auth/refresh')) {
        const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        if (refreshRes.ok) {
            // Retry the original request with new token
            return fetch(url, {
                ...options,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
            });
        }
    }

    return res;
}
