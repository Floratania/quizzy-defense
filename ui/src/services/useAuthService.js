import apiClient from '../api/apiClient';

export function useAuthService() {
    const login = async (email, password) => {
        const { data } = await apiClient.post('/auth/login', { email, password });
        return data;
    };

    const register = async (payload) => {
        const { data } = await apiClient.post('/auth/signup', payload);
        return data;
    };

    const refresh = async () => {
        const { data } = await apiClient.get('/auth/refresh');
        return data;
    };

    const logout = async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch (e) {
            console.error('Logout request failed:', e);
        }
    };

    const me = async () => {
        const { data } = await apiClient.get('/auth/me');
        return data;
    };

    const sendForgotPassword = async (email) => {
        const { data } = await apiClient.post('/auth/forgot-password', { email });
        return data;
    };

    const resetPassword = async (token, newPassword) => {
        const { data } = await apiClient.post('/auth/reset-password', { token, newPassword });
        return data;
    };

    return { login, register, refresh, logout, me, sendForgotPassword, resetPassword };
}
