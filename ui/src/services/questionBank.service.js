import apiClient from '../api/apiClient.js';

export const addQuestionBankExamples = async () => (await apiClient.post('/question-bank/examples')).data;

export const getQuestionBank = async (search = '', topic = '') => {
    const { data } = await apiClient.get('/question-bank', { params: { search, topic } });
    return data;
};

export const saveQuestionToBank = async (question) => {
    const { data } = await apiClient.post('/question-bank', question);
    return data;
};

export const deleteQuestionFromBank = async (id) => {
    await apiClient.delete(`/question-bank/${id}`);
};

export const pickQuestionsFromBank = async (topic, counts) => {
    const { data } = await apiClient.get('/question-bank/pick/automatic', { params: { topic, ...counts } });
    return data;
};
export const getQuestionUsage = async (id) => (await apiClient.get(`/question-bank/${id}/usage`)).data;
