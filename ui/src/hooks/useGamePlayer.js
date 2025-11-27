import { useState, useEffect, useCallback } from "react";
import { socket } from "../ws/socket";
import { connectionService } from "../ws/connectionService";
import {gameService} from "../services/gameService.js";

export function useGamePlayer(sessionId, playerId) {
    const [preview, setPreview] = useState(null);
    const [question, setQuestion] = useState(null);
    const [answerResult, setAnswerResult] = useState(null);
    const [leaderboard, setLeaderboard] = useState(null);
    const [gameFinished, setGameFinished] = useState(false);

    // підключення гравця (на випадок рефрешу)
    useEffect(() => {
        if (!sessionId || !playerId) return;

        connectionService.ensureConnected();

        // якщо ти реалізуєш на бекенді rejoin, можна:
        // socket.emit("rejoin_player", { sessionId, playerId });

        const handlePreview = (data) => {
            setPreview(data);
            setQuestion(null);
            setAnswerResult(null);
            setLeaderboard(null);
        };

        const handleQuestion = (data) => {
            setPreview(null);
            setQuestion(data);
            setAnswerResult(null);
        };

        const handleAnswerReceived = (res) => {
            setAnswerResult(res);
        };

        const handleLeaderboard = (data) => {
            setLeaderboard(data);
        };

        const handleGameFinished = () => {
            setGameFinished(true);
            connectionService.disconnect();
        };

        socket.on("question_preview", handlePreview);
        socket.on("question_started", handleQuestion);
        socket.on("answer_received", handleAnswerReceived);
        socket.on("leaderboard", handleLeaderboard);
        socket.on("game_finished", handleGameFinished);

        return () => {
            socket.off("question_preview", handlePreview);
            socket.off("question_started", handleQuestion);
            socket.off("answer_received", handleAnswerReceived);
            socket.off("leaderboard", handleLeaderboard);
            socket.off("game_finished", handleGameFinished);
        };
    }, [sessionId, playerId]);

    const submitAnswer = useCallback(
        ({ questionId, answerId, timeTaken }) => {
            gameService.submitAnswer({ questionId, answerId, timeTaken });
        },
        []
    );

    return {
        preview,
        question,
        answerResult,
        leaderboard,
        gameFinished,
        submitAnswer,
    };
}
