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


    return {startSession};
}
