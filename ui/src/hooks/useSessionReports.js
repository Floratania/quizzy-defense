import { notifications } from '@mantine/notifications';
import { useEffect, useState } from "react";
import { useQuizzesService } from "../services/useQuizzesService.js";
import {useSessionReportsService} from "../services/useSessionReportsService.js";

export const useSessionReports = () => {
    const {
        getReports,
        getReport
    } = useSessionReportsService();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reports, setReports] = useState([]);
    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getReports()
            console.log(response);
            setReports(response);
        } catch (error) {
            setError(error.message || 'Failed to fetch quizzes');
        } finally {
            setLoading(false);
        }
    };

    const handleGetById = async (id) => {
        try {
            const report = await getReport(id);
            console.log('handle');
            return report;
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: error.message || 'Failed to load quiz',
                color: 'red',
            });
            console.error(error);
            return null;
        }
    };


    useEffect(() => {
        fetchReports();
    }, []);

    return {
        loading,
        reports,
        error,
        fetchReports,
        handleGetById
    };
};
