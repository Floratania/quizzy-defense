import { useEffect, useRef, useState } from "react";

export function useCountdownTimer(timeLimit) {
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (timeLimit == null) return;

        // очищення існуючого таймера
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        setTimeLeft(timeLimit);

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLimit]);

    return timeLeft;
}
