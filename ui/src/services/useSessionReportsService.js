import apiClient from '../api/apiClient.js';

export function useSessionReportsService() {

    const getReports = async () => {
        try {
            const { data } = await apiClient.get('/session-reports');
            console.log(data);
            return data;
        } catch (error) {
            throw new Error(error);
        }
    };

    const getReport = async (id) => {
        try {
            const { data } = await apiClient.get(`/session-reports/${id}`);
            console.log(data);
            return data;
        } catch (error) {
            throw new Error(error);
        }
    };


    return {
        getReports,
        getReport
    };
}
