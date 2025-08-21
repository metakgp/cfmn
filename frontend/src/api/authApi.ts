const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    // Handle token expiration
    if (response.status === 401 && token) {
        localStorage.removeItem('auth_token');
        window.location.reload();
    }

    return response;
};
