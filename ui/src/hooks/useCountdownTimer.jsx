import { useEffect, useRef, useState } from "react";

export function useCountdownTimer(timeLimit, endsAt) {
    const [timeLeft, setTimeLeft] = useState(() => Math.max(0, Math.ceil(((endsAt || Date.now() + (Number(timeLimit) || 0) * 1000) - Date.now()) / 1000)));
    const timerRef = useRef(null);

    useEffect(() => {
        if (timeLimit == null) return;

        // очищення існуючого таймера
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        const deadline = endsAt || Date.now() + timeLimit * 1000;
        const tick = () => setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
        tick();

        timerRef.current = setInterval(tick, 250);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLimit, endsAt]);

    return timeLeft;
}
