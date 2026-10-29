import apiClient from '../api/apiClient.js';

export const addQuestionBankExamples = async () => (await apiClient.post('/question-bank/examples')).data;

export const getQuestionBank = async (search = '', topic = '', ownerId = '', folder = '') => {
    const { data } = await apiClient.get('/question-bank', { params: { search, topic, ownerId, folder } });
    return data;
};

export const saveQuestionToBank = async (question) => {
    const { data } = await apiClient.post('/question-bank', question);
    return data;
};

export const deleteQuestionFromBank = async (id) => {
    await apiClient.delete(`/question-bank/${id}`);
};

export const pickQuestionsFromBank = async (topic, counts, ownerId = '', folder = '') => {
    const { data } = await apiClient.get('/question-bank/pick/automatic', { params: { topic, ...counts, ownerId, folder } });
    return data;
};
export const getQuestionUsage = async (id) => (await apiClient.get(`/question-bank/${id}/usage`)).data;
export const getBankFolders = async (ownerId = '') => (await apiClient.get('/question-bank/folders', {params: {ownerId}})).data;
export const createBankFolder = async (name, ownerId = '') => (await apiClient.post('/question-bank/folders', {name, ...(ownerId ? {ownerId: Number(ownerId)} : {})})).data;
