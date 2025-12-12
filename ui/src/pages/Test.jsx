// PlayerQuestionPage.jsx
import React, { useState } from 'react';
import { Box } from '@mantine/core';
import { PlayerAnswerGrid } from './PlayerAnswerGrid';

export default function KahootGameScreen() {
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    // Mock data - replace with your actual data
    const mockAnswers = [
        { id: 1 },
        { id: 2 },
    ];

    const handleAnswerClick = (answerId) => {
        if (selectedAnswer) return;
        setSelectedAnswer(answerId);
        // Your submit logic here
    };

    return (
        <Box
            style={{
                minHeight: '100vh',
                height: '100vh',
                width: '100vw',
                background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 50%, #fce7f3 100%)",
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0
            }}
        >
            <PlayerAnswerGrid
                answers={mockAnswers}
                selectedAnswer={selectedAnswer}
                onSelect={handleAnswerClick}
            />
        </Box>
    );
}


// PlayerAnswerCard.jsx


/* Add to your global CSS or index.css */
/*
@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

@keyframes checkBounce {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.3) rotate(15deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes pulseOverlay {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.mantine-Paper-root:hover .shine-effect {
  opacity: 0.5;
}

@media (max-width: 768px) {
  @keyframes iconPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
}
*/