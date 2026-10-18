import { useState, useEffect, useCallback, useRef } from "react";
import { socket } from "../ws/socket";
import { connectionService } from "../ws/connectionService";
import {gameService} from "../services/gameService.js";

export function useGameHost(sessionId) {
    const [connected, setConnected] = useState(false);
    const [players, setPlayers] = useState([]);
    const [sessionEvents, setSessionEvents] = useState([]);
    const [preview, setPreview] = useState(null);
    const [question, setQuestion] = useState(null);
    const [results, setResults] = useState(null);
    const [leaderboard, setLeaderboard] = useState(null);
    const [teamLeaderboard, setTeamLeaderboard] = useState([]);
    const [progress, setProgress] = useState([]);
    const [tournamentState, setTournamentState] = useState(null);
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
        setSessionEvents([]);

        const handleHostJoined = (data) => {
            setPlayers((data?.players || []).map((player) => ({ ...player, hasAnswered: false })));
            setGameStarted(data?.status === 'RUNNING');
            setIsGameFinished(data?.status === 'FINISHED');
            setConnected(true);
            setLoading(false);
        };

        const handlePlayerJoined = (player) => {
            console.log(player);
            setPlayers((prev) => prev.some((item) => item.id === player.id)
                ? prev.map((item) => item.id === player.id ? { ...item, ...player } : item)
                : [...prev, { ...player, hasAnswered: false }]);
        };

        const handlePlayerAnswered = (data) => {
            setPlayers((prev) =>
                prev.map((p) =>
                    p.id === data.playerId ? { ...p, hasAnswered: true, eliminated: data.eliminated || p.eliminated } : p
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

            setCurrentQuestionIndex((prev) => data.currentQuestionIndex || prev + 1 || 1);

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
        const handleFinalLeaderboard = (data) => {
            setLeaderboard(data);
            setIsGameFinished(true);
            setGameStarted(false);
            setQuestion(null);
            setResults(null);
            setPreview(null);
        };
        const handlePlayerEliminated = (data) => setPlayers((current) =>
            current.map((player) => player.id === data.playerId ? { ...player, eliminated: true } : player)
        );

        const handleTeamLeaderboard = (data) => setTeamLeaderboard(data);
        const handleSessionEvents = (data) => setSessionEvents((current) => [...new Map([...(data || []), ...current].map((event) => [event.id, event])).values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 200));
        const handleSessionEvent = (data) => setSessionEvents((current) => current.some((event) => event.id === data.id) ? current : [data, ...current].slice(0, 200));
        const handleIntegrityUpdated = (data) => setPlayers((current) => current.map((player) => player.id === data.playerId ? { ...player, integrityEvents: data.integrityEvents } : player));
        const handleProgressSnapshot = (data) => setProgress(data);
        const handleProgressUpdated = (data) => setProgress((current) => {
            const exists = current.some((item) => item.playerId === data.playerId);
            return exists ? current.map((item) => item.playerId === data.playerId ? data : item) : [...current, data];
        });
        const handleTournamentState = (data) => setTournamentState(data);

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

        const reconnectHost = () => gameService.hostJoin(sessionId);
        socket.on('connect', reconnectHost);
        socket.on("host_joined", handleHostJoined);
        socket.on('session_events', handleSessionEvents);
        socket.on('session_event', handleSessionEvent);
        socket.on('integrity_updated', handleIntegrityUpdated);
        socket.on("player_joined", handlePlayerJoined);
        socket.on("player_answered", handlePlayerAnswered);
        socket.on("player_eliminated_host", handlePlayerEliminated);
        socket.on("game_started", handleGameStarted);
        socket.on("question_preview", handlePreview);
        socket.on("question_started", handleQuestionStarted);
        socket.on("question_results", handleResults);
        socket.on("leaderboard", handleLeaderboard);
        socket.on('final_leaderboard', handleFinalLeaderboard);
        socket.on("team_leaderboard", handleTeamLeaderboard);
        socket.on("progress_snapshot", handleProgressSnapshot);
        socket.on("progress_updated", handleProgressUpdated);
        socket.on("tournament_state", handleTournamentState);
        socket.on("game_finished", handleFinished);

        return () => {
            socket.off('connect', reconnectHost);
            socket.off("host_joined", handleHostJoined);
            socket.off('session_events', handleSessionEvents);
            socket.off('session_event', handleSessionEvent);
            socket.off('integrity_updated', handleIntegrityUpdated);
            socket.off("player_joined", handlePlayerJoined);
            socket.off("player_answered", handlePlayerAnswered);
            socket.off("player_eliminated_host", handlePlayerEliminated);
            socket.off("game_started", handleGameStarted);
            socket.off("question_preview", handlePreview);
            socket.off("question_started", handleQuestionStarted);
            socket.off("question_results", handleResults);
            socket.off("leaderboard", handleLeaderboard);
            socket.off('final_leaderboard', handleFinalLeaderboard);
            socket.off("team_leaderboard", handleTeamLeaderboard);
            socket.off("progress_snapshot", handleProgressSnapshot);
            socket.off("progress_updated", handleProgressUpdated);
            socket.off("tournament_state", handleTournamentState);
            socket.off("game_finished", handleFinished);

            clearInterval(timerRef.current);
        };
    }, [sessionId]);

    // Авто-конект при маунті
    useEffect(() => {
        if (!sessionId) return;
        connectHost().catch((error) => { console.error(error.message); setLoading(false); });

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
        sessionEvents,
        connected,
        players,
        preview,
        question,
        results,
        leaderboard,
        teamLeaderboard,
        progress,
        tournamentState,
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
