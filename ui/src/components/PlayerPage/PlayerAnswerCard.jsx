import { Box } from "@mantine/core";
import { ANSWER_STYLES } from "../../constants/answerStyles.js";
import { AnswerCardBase } from "../Question/AnswerCardBase.jsx";

export function PlayerAnswerCard({
                                     answer,
                                     index,
                                     selected,
                                     disabled,
                                     onSelect
                                 }) {
    const style = ANSWER_STYLES[index % ANSWER_STYLES.length];

    // Image variant
    if (answer.imageUrl) {
        return (
            <AnswerCardBase
                answer={answer}
                index={index}
                selected={selected}
                disabled={disabled}
                onSelect={onSelect}
            >
                <Box
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "white"
                    }}
                >
                    <img
                        src={answer.imageUrl}
                        alt={answer.text}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                        }}
                    />
                </Box>
            </AnswerCardBase>
        );
    }

    // Icon only variant
    return (
        <AnswerCardBase
            answer={answer}
            index={index}
            selected={selected}
            disabled={disabled}
            onSelect={onSelect}
        >
            <Box
                style={{
                    fontSize: 80,
                    fontWeight: 700,
                    color: "white",
                    textAlign: "center",
                    textShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    animation: selected ? "iconBounce 0.6s ease-in-out" : "none"
                }}
            >
                {style.icon}
            </Box>
        </AnswerCardBase>
    );
}
