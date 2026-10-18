import { Badge } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";
import { useCountdownTimer } from "../../hooks/useCountdownTimer.jsx";

export function TimerBadge({ timeLimit, endsAt }) {
    const timeLeft = useCountdownTimer(timeLimit, endsAt);

    return (
        <Badge
            size="lg"
            variant="light"
            color={timeLeft > 5 ? 'orange' : timeLeft > 0 ? "red" : "gray"}
            leftSection={<IconClock size={16} />}
        >
            {timeLeft}s
        </Badge>
    );
}
