import { useState, useEffect, useCallback, useRef } from "react";
import { socket } from "../ws/socket";
import { connectionService } from "../ws/connectionService";
import {gameService} from "../services/gameService.js";

export function useGameHost(sessionId) {
    const [connected, setConnected] = useState(false);
    const [players, setPlayers] = useState([]);
    const [preview, setPreview] = useState(null);
    const [question, setQuestion] = useState(null);
    const [results, setResults] = useState(null);
    const [leaderboard, setLeaderboard] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);

    const timerRef = useRef(null);

    const connectHost = useCallback(async () => {
        if (!sessionId) return;

        await connectionService.ensureConnected(); // чекати
        gameService.hostJoin(sessionId); // тепер точно залетить
    }, [sessionId]);


    // Лістенери подій
    useEffect(() => {
        if (!sessionId) return;

        setIsGameFinished(false);

        const handleHostJoined = () => {
            setConnected(true);
            setLoading(false);
        };

        const handlePlayerJoined = (player) => {
            console.log(player);
            setPlayers((prev) => [...prev, { ...player, hasAnswered: false }]);
        };

        const handlePlayerAnswered = (data) => {
            setPlayers((prev) =>
                prev.map((p) =>
                    p.id === data.playerId ? { ...p, hasAnswered: true } : p
                )
            );
        };

        const handleGameStarted = () => {
            setGameStarted(true);
        };

        const handlePreview = (data) => {
            setPreview(data);
            setQuestion(null);
            setResults(null);
            setLeaderboard(null);
            clearInterval(timerRef.current);
            setTimeLeft(null);
        };

        const handleQuestionStarted = (data) => {
            setPreview(null);
            setQuestion(data);
            setResults(null);

            setCurrentQuestionIndex((prev) => prev + 1 || 1);

            setPlayers((prev) =>
                prev.map((p) => ({ ...p, hasAnswered: false }))
            );
            console.log(data.timeLimit);

            clearInterval(timerRef.current);
            setTimeLeft(data.timeLimit);

            timerRef.current = setInterval(() => {
                setTimeLeft((t) => {
                    if (t === null) return null;
                    if (t <= 1) {
                        clearInterval(timerRef.current);
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        };

        const handleResults = (data) => {
            setResults(data);
            setQuestion(null);
            clearInterval(timerRef.current);
            setTimeLeft(null);
        };

        const handleLeaderboard = (data) => {
            setLeaderboard(data);
            setResults(null);
            setQuestion(null);
        };

        const handleFinished = () => {
            setGameStarted(false);
            setPreview(null);
            setQuestion(null);
            setIsGameFinished(true);
            setResults(null);
            clearInterval(timerRef.current);
            setTimeLeft(null);
            connectionService.disconnect();
        };

        socket.on("host_joined", handleHostJoined);
        socket.on("player_joined", handlePlayerJoined);
        socket.on("player_answered", handlePlayerAnswered);
        socket.on("game_started", handleGameStarted);
        socket.on("question_preview", handlePreview);
        socket.on("question_started", handleQuestionStarted);
        socket.on("question_results", handleResults);
        socket.on("leaderboard", handleLeaderboard);
        socket.on("game_finished", handleFinished);

        return () => {
            socket.off("host_joined", handleHostJoined);
            socket.off("player_joined", handlePlayerJoined);
            socket.off("player_answered", handlePlayerAnswered);
            socket.off("game_started", handleGameStarted);
            socket.off("question_preview", handlePreview);
            socket.off("question_started", handleQuestionStarted);
            socket.off("question_results", handleResults);
            socket.off("leaderboard", handleLeaderboard);
            socket.off("game_finished", handleFinished);

            clearInterval(timerRef.current);
        };
    }, [sessionId]);

    // Авто-конект при маунті
    useEffect(() => {
        if (!sessionId) return;
        connectHost();

        return () => {
            clearInterval(timerRef.current);
            // НЕ обовʼязково disconnect тут, якщо хост може перезайти
            // connectionService.disconnect();
        };
    }, [sessionId, connectHost]);

    const startGame = useCallback(() => {
        if (!sessionId) return;
        gameService.startGame(sessionId);
    }, [sessionId]);

    const nextQuestion = useCallback(() => {
        if (!sessionId) return;
        gameService.nextQuestion(sessionId);
    }, [sessionId]);

    return {
        connected,
        players,
        preview,
        question,
        results,
        leaderboard,
        currentQuestionIndex,
        gameStarted,
        timeLeft,
        loading,
        sessionId,
        isGameFinished,
        connectHost,
        startGame,
        nextQuestion,
    };
}
