import { notifications } from '@mantine/notifications';
import { useEffect, useState } from "react";
import { useQuizzesService } from "../services/useQuizzesService.js";

export const useQuizzes = () => {
    const {
        createQuiz,
        getQuizzes,
        getQuizById,
        updateQuiz,
        deleteQuiz
    } = useQuizzesService();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quizzes, setQuizzes] = useState([]);

    // -------------------------
    // CREATE
    // -------------------------
    const handleCreate = async (quiz) => {
        try {
            const created = await createQuiz(quiz);

            // add to state
            setQuizzes(prev => [...prev, created]);

            notifications.show({
                title: 'Success',
                message: 'Quiz created successfully',
                color: 'green',
            });

            return created;
        } catch (err) {
            console.error(err);
            notifications.show({
                title: 'Error',
                message: err.message || 'Failed to create quiz',
                color: 'red',
            });
        }
    };

    // -------------------------
    // READ ALL
    // -------------------------
    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getQuizzes();
            setQuizzes(response);
        } catch (error) {
            setError(error.message || 'Failed to fetch quizzes');
        } finally {
            setLoading(false);
        }
    };

    // -------------------------
    // READ ONE
    // -------------------------
    const handleGetById = async (id) => {
        try {
            const quiz = await getQuizById(id);
            return quiz;
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

    // -------------------------
    // UPDATE
    // -------------------------
    const handleUpdate = async (id, quizData) => {
        try {
            const updated = await updateQuiz(id, quizData);

            // update in local state
            setQuizzes(prev =>
                prev.map(q => (q.id === id ? updated : q))
            );

            notifications.show({
                title: 'Success',
                message: 'Quiz updated successfully',
                color: 'green',
            });

            return updated;
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: error.message || 'Failed to update quiz',
                color: 'red',
            });
            console.error(error);
            return null;
        }
    };

    // -------------------------
    // DELETE
    // -------------------------
    const handleDelete = async (id) => {
        try {
            await deleteQuiz(id);

            // remove locally
            setQuizzes(prev => prev.filter(q => q.id !== id));

            notifications.show({
                title: 'Deleted',
                message: 'Quiz removed',
                color: 'green',
            });

        } catch (error) {
            notifications.show({
                title: 'Error',
                message: error.message || 'Failed to delete quiz',
                color: 'red',
            });
            console.error(error);
        }
    };

    // -------------------------
    // ON MOUNT
    // -------------------------
    useEffect(() => {
        fetchQuizzes();
    }, []);

    return {
        quizzes,
        loading,
        error,
        fetchQuizzes,

        // CRUD
        handleCreate,
        handleGetById,
        handleUpdate,
        handleDelete,
    };
};
