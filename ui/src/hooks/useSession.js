import { notifications } from '@mantine/notifications';
import {useState} from "react";
import {useSessionService} from "../services/useSessionService.js";

export const useSession = () => {
    const [sessionId, setSessionId] = useState('');
    const { startSession } = useSessionService();

    const newSession = async (quizId) => {
        try {
            const response = await startSession(quizId);
            setSessionId(response);

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

    return { newSession };
};
