import { notifications } from '@mantine/notifications';
import {useCallback, useEffect, useState} from "react";
import {useSessionService} from "../services/useSessionService.js";

export const useSession = () => {

    const [activeSessions, setActiveSessions] = useState([]);
    const { startSession, getActiveSessions, getSession, finishSession } = useSessionService();

    const refreshActiveSessions = useCallback(async () => {
        try {
            setActiveSessions(await getActiveSessions());
        } catch (error) {
            console.error('Failed to load active sessions', error);
        }
    }, []);

    useEffect(() => {
        refreshActiveSessions();
        const interval = setInterval(refreshActiveSessions, 5000);
        return () => clearInterval(interval);
    }, [refreshActiveSessions]);

    const newSession = async (quizId) => {
        try {
            const response = await startSession(quizId);

            await refreshActiveSessions();

            notifications.show({
                title: 'Success',
                message: 'Session started successfully',
                color: 'green',
            });
            console.log('response', response);

            return response;
        } catch (err) {
            console.error(err);
            notifications.show({
                title: 'Error',
                message: err.message || 'Failed to start session',
                color: 'red',
            });
        }
    };

    const closeSession = async (id) => {
        await finishSession(id);
        await refreshActiveSessions();
    };

    return { newSession, activeSessions, refreshActiveSessions, getSession, closeSession };
};
