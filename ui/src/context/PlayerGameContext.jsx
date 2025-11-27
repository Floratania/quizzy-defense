import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGamePlayer } from '../hooks/useGamePlayer.js';

const PlayerGameContext = createContext();

export const usePlayerGameContext = () => {
    const context = useContext(PlayerGameContext);
    if (!context) {
        throw new Error('usePlayerGameContext must be used within PlayerGameProvider');
    }
    return context;
};

export const PlayerGameProvider = ({ children }) => {
    const playerId = localStorage.getItem("playerId");
    const nickname = localStorage.getItem("nickname");
    const sessionId = localStorage.getItem("sessionId");

    const player = useGamePlayer(sessionId, playerId);
    const [startTime, setStartTime] = useState(null);

    useEffect(() => {
        if (player.question) {
            setStartTime(Date.now());
        }
    }, [player.question]);

    const submitAnswer = (answerId) => {
        const timeTaken = Date.now() - startTime;
        player.submitAnswer({
            questionId: player.question.id,
            answerId: answerId,
            timeTaken: timeTaken,
        });
    };

    return (
        <PlayerGameContext.Provider value={{
            player,
            nickname,
            sessionId,
            submitAnswer
        }}>
            {children}
        </PlayerGameContext.Provider>
    );
};
