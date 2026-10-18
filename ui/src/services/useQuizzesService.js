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

    const generateQuiz = async (settings) => {
        try {
            const { data } = await apiClient.post('/quizzes/generate', settings);
            return data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Не вдалося згенерувати вікторину');
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
            const { data } = await apiClient.patch(`/quizzes/${id}`, quiz);
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

    const duplicateQuiz = async (id) => (await apiClient.post(`/quizzes/${id}/duplicate`)).data;

    return {
        createQuiz,
        generateQuiz,
        getQuizzes,
        getQuizById,
        updateQuiz,
        deleteQuiz,
        duplicateQuiz
    };
}
