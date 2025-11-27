import apiClient from '../api/apiClient.js';

export function useQuizzesService() {

    const createQuiz = async (quiz) => {
        try {
            const { data } = await apiClient.post('/quizzes', quiz);
            return data;
        } catch (error) {
            throw new Error(error);
        }
    };

    const getQuizzes = async () => {
        try {
            const { data } = await apiClient.get('/quizzes/my');
            return data;
        } catch (error) {
            throw new Error(error);
        }
    };

    const getQuizById = async (id) => {
        try {
            const { data } = await apiClient.get(`/quizzes/${id}`);
            return data;
        } catch (error) {
            throw new Error(error);
        }
    };

    const updateQuiz = async (id, quiz) => {
        try {
            const { data } = await apiClient.put(`/quizzes/${id}`, quiz);
            return data;
        } catch (error) {
            throw new Error(error);
        }
    };

    const deleteQuiz = async (id) => {
        try {
            const { data } = await apiClient.delete(`/quizzes/${id}`);
            return data;
        } catch (error) {
            throw new Error(error);
        }
    };

    return {
        createQuiz,
        getQuizzes,
        getQuizById,
        updateQuiz,
        deleteQuiz
    };
}
