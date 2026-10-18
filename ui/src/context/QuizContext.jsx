import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuthContext } from './AuthContext.jsx';
import { loadQuizDraft, saveQuizDraft, deleteQuizDraft } from '../utils/quizDrafts.js';
import { QuestionType } from "../constants/question-type.constants.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import { useParams } from "react-router-dom";
import { useQuizzes } from "../hooks/useQuizzes.js";
import { saveQuestionToBank } from '../services/questionBank.service.js';
import { notifications } from '@mantine/notifications';

const QuizContext = createContext();

export const useQuizContext = () => {
    const ctx = useContext(QuizContext);
    if (!ctx) throw new Error("useQuizContext must be used inside QuizProvider");
    return ctx;
};

const createDefaultQuestion = () => ({
    type: "multiple_choice",
    text: "",
    explanation: '',
    image: null,
    imageUrl: null,
    imagePreview: null,

    answers: ["", "", "", ""],
    answerImages: [null, null, null, null],
    answerImageUrls: [null, null, null, null],
    answerImagePreviews: [null, null, null, null],

    correctAnswers: [0],
    numberOfAnswers: 4,
    timeLimit: 30,
    points: 1000,
    saveToBank: false,
    matchingPairs: [
        { leftId: crypto.randomUUID(), left: "", rightId: crypto.randomUUID(), right: "" },
        { leftId: crypto.randomUUID(), left: "", rightId: crypto.randomUUID(), right: "" },
    ],
    orderingItems: [
        { id: crypto.randomUUID(), text: "" },
        { id: crypto.randomUUID(), text: "" },
    ],
    fillBlankItems: [
        { id: crypto.randomUUID(), text: '' },
        { id: crypto.randomUUID(), text: '' },
    ],
});

export function QuizProvider({ children }) {
    const { id } = useParams();              // <-- determine mode
    const isEdit = Boolean(id);
    const { user } = useAuthContext();
    const draftKey = user?.id ? `user:${user.id}:quiz:${id || 'new'}` : null;
    const [draftStatus, setDraftStatus] = useState('');
    const [draftRestored, setDraftRestored] = useState(false);
    const skipDraftSave = useRef(false);
    const hydratedDraftKey = useRef(null);

    const { handleGetById, handleCreate, handleUpdate, handleGenerate } = useQuizzes();

    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        topic: "",
        bankFolder: "Загальна",
        bankTags: "",
        bankDifficulty: "medium",
        passThreshold: 60,
        availableFrom: "",
        availableUntil: "",
        maxAttempts: 0,
        requireFullscreen: false,
        trackTabSwitches: false,
        feedbackMode: "IMMEDIATE",
        shuffleQuestions: false,
        shuffleAnswers: false,
        status: "draft",
        questionsData: []
    });

    const [currentQuestion, setCurrentQuestion] = useState(createDefaultQuestion);
    const initialFormData = useRef(formData);
    const [editingQuestionId, setEditingQuestionId] = useState(null);

    // -------------------------
    // LOAD QUIZ IF EDIT MODE
    // -------------------------
    useEffect(() => {
        let cancelled = false;
        async function load() {
            hydratedDraftKey.current = null;
            setLoading(true);
            skipDraftSave.current = false;
            if (draftKey) {
                try {
                    const draft = await loadQuizDraft(draftKey);
                    if (cancelled) return;
                    if (draft?.version === 1 && draft.formData && draft.currentQuestion) {
                        setFormData(draft.formData);
                        setCurrentQuestion(draft.currentQuestion);
                        setEditingQuestionId(draft.editingQuestionId ?? null);
                        setDraftRestored(true);
                        hydratedDraftKey.current = draftKey;
                        setLoading(false);
                        return;
                    }
                } catch { setDraftStatus('Автозбереження недоступне в цьому браузері'); }
            }
            if (!isEdit) {
                setFormData({ ...initialFormData.current, questionsData: [] });
                setCurrentQuestion(createDefaultQuestion());
                setEditingQuestionId(null);
                hydratedDraftKey.current = draftKey;
                setLoading(false);
                return;
            }

            const quiz = await handleGetById(id);
            if (cancelled) return;

            setFormData({
                title: quiz.title,
                description: quiz.description,
                topic: quiz.topic || "",
                passThreshold: quiz.passThreshold ?? 60, availableFrom: quiz.availableFrom?.slice(0,16) || '',
                availableUntil: quiz.availableUntil?.slice(0,16) || '', maxAttempts: quiz.maxAttempts ?? 0,
                requireFullscreen: Boolean(quiz.requireFullscreen), trackTabSwitches: Boolean(quiz.trackTabSwitches),
                feedbackMode: quiz.feedbackMode || "IMMEDIATE",
                shuffleQuestions: quiz.shuffleQuestions ?? false,
                shuffleAnswers: quiz.shuffleAnswers ?? false,
                status: quiz.status ?? "draft",
                questionsData: quiz.questions.map((q) => ({
                    id: q.id,
                    type: q.type,
                    text: q.text,
                    explanation: q.explanation || '',
                    timeLimit: q.timeLimit,
                    points: q.points,
                    configuration: q.configuration || null,
                    matchingPairs: q.configuration?.pairs || createDefaultQuestion().matchingPairs,
                    orderingItems: q.configuration?.items
                        ?.sort((a, b) => a.correctPosition - b.correctPosition)
                        .map(({ id, text }) => ({ id, text })) || createDefaultQuestion().orderingItems,
                    fillBlankItems: q.type === 'fill_blank' && q.configuration?.items
                        ? [...q.configuration.items]
                            .sort((a, b) => a.correctPosition - b.correctPosition)
                            .map(({ id, text }) => ({ id, text }))
                        : createDefaultQuestion().fillBlankItems,

                    image: null,
                    imageUrl: q.mediaUrl || null,
                    imagePreview: q.mediaUrl || null,

                    answers: q.answers.map(a => a.text),
                    answerImages: [null, null, null, null],
                    answerImageUrls: q.answers.map(a => a.mediaUrl || null),
                    answerImagePreviews: q.answers.map(a => a.mediaUrl || null),

                    correctAnswers: q.answers
                        .map((a, i) => (a.isCorrect ? i : null))
                        .filter(i => i !== null),

                    numberOfAnswers: q.answers.length
                }))
            });

            hydratedDraftKey.current = draftKey;
            setLoading(false);
        }

        load();
        return () => { cancelled = true; };
    }, [id, draftKey]);

    useEffect(() => {
        if (loading || !draftKey || hydratedDraftKey.current !== draftKey || skipDraftSave.current) return;
        let current = true;
        const savedAt = new Date().toISOString();
        saveQuizDraft(draftKey, { version: 1, formData, currentQuestion, editingQuestionId, savedAt })
            .then(() => { if (current) setDraftStatus(`Чернетку збережено о ${new Date(savedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`); })
            .catch(() => { if (current) setDraftStatus('Не вдалося зберегти чернетку. Перевірте вільне місце та доступ до сховища браузера.'); });
        return () => { current = false; };
    }, [formData, currentQuestion, editingQuestionId, loading, draftKey]);

    const discardDraft = async () => {
        if (!draftKey || !window.confirm('Видалити локальну чернетку? Незбережені зміни буде втрачено.')) return;
        await deleteQuizDraft(draftKey);
        skipDraftSave.current = true;
        window.location.reload();
    };

    // -------------------------
    // HELPERS
    // -------------------------

    function resetCurrentQuestion() {
        setCurrentQuestion(createDefaultQuestion());
        setEditingQuestionId(null);
    }

    const editQuestion = (questionId) => {
        const question = formData.questionsData.find((item) => item.id === questionId);
        if (!question) return;
        setCurrentQuestion({ ...createDefaultQuestion(), ...structuredClone(question), saveToBank: false });
        setEditingQuestionId(questionId);
    };

    function mapFrontendTypeToEnum(frontType) {
        switch (frontType) {
            case "quiz":
            case "multiple_choice":
                return QuestionType.MULTIPLE_CHOICE;

            case "multiple_response":
                return QuestionType.MULTIPLE_RESPONSE;

            case "true_false":
                return QuestionType.TRUE_FALSE;

            case "text-input":
            case "open_text":
                return QuestionType.OPEN_TEXT;

            case "fill_blank":
                return QuestionType.FILL_BLANK;

            case "matching":
                return QuestionType.MATCHING;

            case "ordering":
                return QuestionType.ORDERING;

            default:
                return QuestionType.MULTIPLE_CHOICE;
        }
    }

    async function uploadMediaForQuestion(q) {
        const updated = { ...q };

        // Question image
        if (q.image && !q.imageUrl) {
            updated.imageUrl = await uploadToCloudinary(q.image);
        }

        // Answers images
        updated.answerImageUrls = await Promise.all(
            (q.answerImages || []).map(async (file, idx) => {
                if (!file) return q.answerImageUrls?.[idx] || null;
                return await uploadToCloudinary(file);
            })
        );

        return updated;
    }

    const transformQuizData = (form) => ({
        title: form.title,
        description: form.description || null,
        topic: form.topic?.trim() || 'Без теми',
        passThreshold: Number(form.passThreshold) || 0, availableFrom: form.availableFrom || null,
        availableUntil: form.availableUntil || null, maxAttempts: Number(form.maxAttempts) || 0,
        requireFullscreen: Boolean(form.requireFullscreen), trackTabSwitches: Boolean(form.trackTabSwitches),
        feedbackMode: form.feedbackMode || "IMMEDIATE",
        shuffleQuestions: Boolean(form.shuffleQuestions),
        shuffleAnswers: Boolean(form.shuffleAnswers),
        questions: form.questionsData.map((q) => ({
            text: q.text,
            explanation: q.explanation || undefined,
            timeLimit: q.timeLimit,
            points: q.points,

            mediaUrl: q.imageUrl || null,
            type: mapFrontendTypeToEnum(q.type),

            configuration: q.type === "matching"
                ? { pairs: q.matchingPairs }
                : q.type === "ordering"
                    ? { items: q.orderingItems.map((item, correctPosition) => ({ ...item, correctPosition })) }
                    : q.type === "fill_blank"
                        ? { items: q.fillBlankItems.map((item, correctPosition) => ({ ...item, correctPosition })) }
                    : q.type === "open_text"
                        ? { caseSensitive: false }
                        : null,

            answers: (["matching", "ordering", "fill_blank"].includes(q.type) ? [] : q.answers).map((text, idx) => ({
                text: text || "",
                mediaUrl: q.answerImageUrls?.[idx] || null,
                isCorrect: q.type === 'open_text' || q.correctAnswers.includes(idx),
            })),
        })),
    });

    // -------------------------
    // ACTIONS
    // -------------------------

    const saveQuestionInBank = async (question) => {
        const uploaded = await uploadMediaForQuestion(question);
        const payload = { ...uploaded };
        ['image', 'imagePreview', 'answerImages', 'answerImagePreviews', 'saveToBank', 'id'].forEach((key) => delete payload[key]);
        await saveQuestionToBank({
            text: uploaded.text,
            topic: formData.topic?.trim() || 'Без теми',
            folder: formData.bankFolder || 'Загальна',
            tags: (formData.bankTags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
            difficulty: formData.bankDifficulty || 'medium',
            payload,
        });
        window.dispatchEvent(new Event('question-bank-updated'));
        return uploaded;
    };

    const addQuestion = async () => {
        if (!currentQuestion.text.trim()) return false;

        if (currentQuestion.type === "matching") {
            if (currentQuestion.matchingPairs.length < 2 || currentQuestion.matchingPairs.some((pair) => !pair.left.trim() || !pair.right.trim())) return false;
        } else if (currentQuestion.type === "ordering") {
            if (currentQuestion.orderingItems.length < 2 || currentQuestion.orderingItems.some((item) => !item.text.trim())) return false;
        } else if (currentQuestion.type === 'fill_blank') {
            const blankCount = currentQuestion.text.split('___').length - 1;
            if (blankCount < 2 || blankCount > 8 || blankCount !== currentQuestion.fillBlankItems.length
                || currentQuestion.fillBlankItems.some((item) => !item.text.trim())) return false;
        } else if (currentQuestion.type === 'open_text') {
            if (!currentQuestion.answers.length || currentQuestion.answers.some((answer) => !answer.trim())) {
                notifications.show({ color: 'red', message: 'Заповніть усі варіанти відповіді або видаліть порожні.' });
                return false;
            }
        } else if (currentQuestion.type !== "text-input") {
            const filled = currentQuestion.answers
                .slice(0, currentQuestion.numberOfAnswers)
                .every(a => a.trim());
            if (!filled) return false;
            if (currentQuestion.type === 'multiple_response' && currentQuestion.correctAnswers.length < 2) return false;
        }

        let question = { ...currentQuestion, id: editingQuestionId ?? crypto.randomUUID() };
        if (currentQuestion.saveToBank) {
            try {
                question = await saveQuestionInBank(question);
                notifications.show({ color: 'green', message: 'Питання додано до вікторини та збережено в банк' });
            } catch {
                notifications.show({ color: 'red', message: 'Не вдалося зберегти питання в банк. Спробуйте ще раз або вимкніть збереження до банку.' });
                return false;
            }
        }
        setFormData((prev) => ({
            ...prev,
            questionsData: editingQuestionId !== null
                ? prev.questionsData.map((item) => item.id === editingQuestionId ? question : item)
                : [...prev.questionsData, question],
        }));

        resetCurrentQuestion();
        return true;
    };

    const removeQuestion = (id) => {
        if (id === editingQuestionId) resetCurrentQuestion();
        setFormData((prev) => ({
            ...prev,
            questionsData: prev.questionsData.filter((q) => q.id !== id),
        }));
    };

    const moveQuestion = (id, direction) => {
        setFormData((prev) => {
            const questions = [...prev.questionsData];
            const index = questions.findIndex((question) => question.id === id);
            const target = index + direction;
            if (index < 0 || target < 0 || target >= questions.length) return prev;
            [questions[index], questions[target]] = [questions[target], questions[index]];
            return { ...prev, questionsData: questions };
        });
    };

    const updateFormData = (updates) => {
        setFormData((p) => ({ ...p, ...updates }));
    };

    const updateCurrentQuestion = (updates) => {
        setCurrentQuestion((p) => ({ ...p, ...updates }));
    };

    const addQuestionFromBank = (storedQuestion) => {
        const defaults = createDefaultQuestion();
        const copy = {
            ...defaults,
            ...storedQuestion,
            saveToBank: false,
            id: crypto.randomUUID(),
            image: null,
            imagePreview: storedQuestion.imageUrl || null,
            matchingPairs: (storedQuestion.matchingPairs || defaults.matchingPairs).map((pair) => ({
                ...pair, leftId: crypto.randomUUID(), rightId: crypto.randomUUID(),
            })),
            orderingItems: (storedQuestion.orderingItems || defaults.orderingItems).map((item) => ({ ...item, id: crypto.randomUUID() })),
            fillBlankItems: (storedQuestion.fillBlankItems || defaults.fillBlankItems).map((item) => ({ ...item, id: crypto.randomUUID() })),
            answerImages: (storedQuestion.answers || []).map(() => null),
            answerImagePreviews: storedQuestion.answerImageUrls || [],
        };
        setFormData((previous) => ({ ...previous, questionsData: [...previous.questionsData, copy] }));
    };

    const generateFromText = async (settings) => {
        const generated = await handleGenerate(settings);
        setFormData((previous) => ({
            ...previous,
            title: generated.title?.slice(0, 100) || previous.title,
            description: generated.description?.slice(0, 100) || '',
            questionsData: generated.questions.map((question) => {
                const defaults = createDefaultQuestion();
                const answers = (question.answers || []).map((answer) => answer.text);
                const configuredItems = [...(question.configuration?.items || [])]
                    .sort((a, b) => a.correctPosition - b.correctPosition)
                    .map(({ id, text }) => ({ id: id || crypto.randomUUID(), text }));

                return {
                    ...defaults,
                    id: crypto.randomUUID(),
                    type: question.type,
                    text: question.text,
                    timeLimit: question.timeLimit || 30,
                    points: question.points || 1000,
                    configuration: question.configuration || null,
                    answers,
                    answerImages: answers.map(() => null),
                    answerImageUrls: answers.map(() => null),
                    answerImagePreviews: answers.map(() => null),
                    correctAnswers: (question.answers || [])
                        .map((answer, index) => answer.isCorrect ? index : null)
                        .filter((index) => index !== null),
                    numberOfAnswers: answers.length,
                    matchingPairs: question.type === 'matching'
                        ? question.configuration?.pairs || []
                        : defaults.matchingPairs,
                    orderingItems: question.type === 'ordering' ? configuredItems : defaults.orderingItems,
                    fillBlankItems: question.type === 'fill_blank' ? configuredItems : defaults.fillBlankItems,
                };
            }),
        }));
        return generated;
    };

    // -------------------------
    // SUBMIT (CREATE or UPDATE)
    // -------------------------

    const submitQuiz = async () => {
        // 1. Upload media
        const updatedQuestions = [];
        for (const q of formData.questionsData) {
            updatedQuestions.push(await uploadMediaForQuestion(q));
        }

        const improvedFormData = { ...formData, questionsData: updatedQuestions };

        // 2. DTO transform
        const payload = transformQuizData(improvedFormData);

        // 3. API call
        const result = isEdit ? await handleUpdate(id, payload) : await handleCreate(payload);
        skipDraftSave.current = true;
        if (draftKey) await deleteQuizDraft(draftKey).catch(() => {});
        return result;
    };

    // -------------------------
    // CONTEXT VALUE
    // -------------------------

    return (
        <QuizContext.Provider
            value={{
                loading,
                draftStatus,
                draftRestored,
                discardDraft,
                isEdit,

                formData,
                currentQuestion,
                editingQuestionId,
                editQuestion,
                cancelQuestionEdit: resetCurrentQuestion,

                addQuestion,
                removeQuestion,
                moveQuestion,
                updateFormData,
                updateCurrentQuestion,
                setCurrentQuestion,
                generateFromText,
                addQuestionFromBank,
                saveQuestionInBank,

                submitQuiz,
            }}
        >
            {children}
        </QuizContext.Provider>
    );
}
