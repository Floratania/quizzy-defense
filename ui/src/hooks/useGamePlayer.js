import { useState, useEffect, useCallback } from "react";
import { socket } from "../ws/socket";
import { connectionService } from "../ws/connectionService";
import {gameService} from "../services/gameService.js";
import { readFinalResult, saveFinalResult } from '../utils/finalResultCache.js';

export function useGamePlayer(sessionId, playerId) {
    const [preview, setPreview] = useState(null);
    const [question, setQuestion] = useState(null);
    const [answerResult, setAnswerResult] = useState(null);
    const [leaderboard, setLeaderboard] = useState(null);
    const [gameFinished, setGameFinished] = useState(false);
    const [teamLeaderboard, setTeamLeaderboard] = useState([]);
    const [playerCompleted, setPlayerCompleted] = useState(false);
    const [eliminated, setEliminated] = useState(false);
    const [eliminationReason, setEliminationReason] = useState(null);
    const [finalResult, setFinalResult] = useState(() => readFinalResult(sessionId, playerId));
    const [settings, setSettings] = useState({});

    useEffect(() => {
        if (!sessionId || !playerId) return;

        connectionService.ensureConnected().catch((error) => console.error(error.message));

        const resume = () => gameService.resumeSession(sessionId, playerId);
        socket.on('connect', resume);


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
        const handleTeamLeaderboard = (data) => setTeamLeaderboard(data);
        const handlePlayerCompleted = () => setPlayerCompleted(true);
        const handlePlayerEliminated = (data) => {
            setEliminated(true);
            setEliminationReason(data?.reason || 'incorrect');
        };

        const handleGameFinished = (data) => {
            if (data?.result) {
                setFinalResult(data.result);
                saveFinalResult(sessionId, playerId, data.result);
            }
            setGameFinished(true);
            connectionService.disconnect();
        };
        const handleResumed = (data) => setSettings(data?.settings || {});
        socket.on('session_resumed', handleResumed);

        socket.on("question_preview", handlePreview);
        socket.on("question_started", handleQuestion);
        socket.on("answer_received", handleAnswerReceived);
        socket.on("leaderboard", handleLeaderboard);
        socket.on("team_leaderboard", handleTeamLeaderboard);
        socket.on("player_completed", handlePlayerCompleted);
        socket.on("player_eliminated", handlePlayerEliminated);
        socket.on("game_finished", handleGameFinished);
        if (socket.connected) resume();

        return () => {
            socket.off("question_preview", handlePreview);
            socket.off("question_started", handleQuestion);
            socket.off("answer_received", handleAnswerReceived);
            socket.off("leaderboard", handleLeaderboard);
            socket.off("team_leaderboard", handleTeamLeaderboard);
            socket.off("player_completed", handlePlayerCompleted);
            socket.off("player_eliminated", handlePlayerEliminated);
            socket.off("game_finished", handleGameFinished);
            socket.off('connect', resume);
            socket.off('session_resumed', handleResumed);
        };
    }, [sessionId, playerId]);

    const submitAnswer = useCallback(
        ({ questionId, answerId, response, timeTaken }) => {
            gameService.submitAnswer({ questionId, answerId, response, timeTaken });
        },
        []
    );

    return {
        preview,
        question,
        answerResult,
        leaderboard,
        gameFinished,
        teamLeaderboard,
        playerCompleted,
        eliminated,
        eliminationReason,
        finalResult,
        settings,
        submitAnswer,
    };
}
