import React, { createContext, useContext, useState, useEffect } from "react";
import { QuestionType } from "../constants/question-type.constants.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";
import { useParams } from "react-router-dom";
import { useQuizzes } from "../hooks/useQuizzes.js";

const QuizContext = createContext();

export const useQuizContext = () => {
    const ctx = useContext(QuizContext);
    if (!ctx) throw new Error("useQuizContext must be used inside QuizProvider");
    return ctx;
};

const defaultQuestion = {
    type: "quiz",
    text: "",
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
};

export function QuizProvider({ children }) {
    const { id } = useParams();              // <-- determine mode
    const isEdit = Boolean(id);

    const { handleGetById, handleCreate, handleUpdate } = useQuizzes();

    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "draft",
        questionsData: []
    });

    const [currentQuestion, setCurrentQuestion] = useState(defaultQuestion);

    // -------------------------
    // LOAD QUIZ IF EDIT MODE
    // -------------------------
    useEffect(() => {
        async function load() {
            if (!isEdit) {
                setLoading(false);
                return;
            }

            const quiz = await handleGetById(id);

            setFormData({
                title: quiz.title,
                description: quiz.description,
                status: quiz.status ?? "draft",
                questionsData: quiz.questions.map((q) => ({
                    id: q.id,
                    type: q.type,
                    text: q.text,
                    timeLimit: q.timeLimit,
                    points: q.points,

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

            setLoading(false);
        }

        load();
    }, [id]);

    // -------------------------
    // HELPERS
    // -------------------------

    function resetCurrentQuestion() {
        setCurrentQuestion(defaultQuestion);
    }

    function mapFrontendTypeToEnum(frontType) {
        switch (frontType) {
            case "quiz":
            case "multiple_choice":
                return QuestionType.MULTIPLE_CHOICE;

            case "true_false":
                return QuestionType.TRUE_FALSE;

            case "text-input":
            case "open_text":
                return QuestionType.OPEN_TEXT;

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
            q.answerImages.map(async (file, idx) => {
                if (!file) return q.answerImageUrls?.[idx] || null;
                return await uploadToCloudinary(file);
            })
        );

        return updated;
    }

    const transformQuizData = (form) => ({
        title: form.title,
        description: form.description || null,
        questions: form.questionsData.map((q) => ({
            text: q.text,
            timeLimit: q.timeLimit,
            points: q.points,

            mediaUrl: q.imageUrl || null,
            type: mapFrontendTypeToEnum(q.type),

            answers: q.answers.map((text, idx) => ({
                text: text || "",
                mediaUrl: q.answerImageUrls?.[idx] || null,
                isCorrect: q.correctAnswers.includes(idx),
            })),
        })),
    });

    // -------------------------
    // ACTIONS
    // -------------------------

    const addQuestion = () => {
        if (!currentQuestion.text.trim()) return false;

        if (currentQuestion.type !== "text-input") {
            const filled = currentQuestion.answers
                .slice(0, currentQuestion.numberOfAnswers)
                .every(a => a.trim());
            if (!filled) return false;
        }

        setFormData((prev) => ({
            ...prev,
            questionsData: [...prev.questionsData, { id: Date.now(), ...currentQuestion }],
        }));

        resetCurrentQuestion();
        return true;
    };

    const removeQuestion = (id) => {
        setFormData((prev) => ({
            ...prev,
            questionsData: prev.questionsData.filter((q) => q.id !== id),
        }));
    };

    const updateFormData = (updates) => {
        setFormData((p) => ({ ...p, ...updates }));
    };

    const updateCurrentQuestion = (updates) => {
        setCurrentQuestion((p) => ({ ...p, ...updates }));
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
        if (isEdit) {
            return await handleUpdate(id, payload);
        } else {
            return await handleCreate(payload);
        }
    };

    // -------------------------
    // CONTEXT VALUE
    // -------------------------

    return (
        <QuizContext.Provider
            value={{
                loading,
                isEdit,

                formData,
                currentQuestion,

                addQuestion,
                removeQuestion,
                updateFormData,
                updateCurrentQuestion,
                setCurrentQuestion,

                submitQuiz,
            }}
        >
            {children}
        </QuizContext.Provider>
    );
}
