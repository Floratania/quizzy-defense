import apiClient from '../api/apiClient.js';

export function useSessionService() {
    const startSession = async (quizId) => {
        try {
            const {data} = await apiClient.post('/game-sessions', quizId);
            return data;
        } catch (error) {
            throw new Error(error);
        }
    };

    const getActiveSessions = async () => {
        const { data } = await apiClient.get('/game-sessions/my/active');
        return data;
    };

    const getSession = async (id) => {
        const { data } = await apiClient.get(`/game-sessions/${id}`);
        return data;
    };

    const finishSession = async (id) => {
        const { data } = await apiClient.post(`/game-sessions/${id}/finish`);
        return data;
    };


    return {startSession, getActiveSessions, getSession, finishSession};
}
