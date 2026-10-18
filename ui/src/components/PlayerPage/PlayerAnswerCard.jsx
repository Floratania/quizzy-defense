import { Box } from "@mantine/core";
import { ANSWER_STYLES } from "../../constants/answerStyles.js";
import { AnswerCardBase } from "../Question/AnswerCardBase.jsx";
import RichText from '../Question/RichText.jsx';

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

    // Text answer with a small shape marker
    return (
        <AnswerCardBase
            answer={answer}
            index={index}
            selected={selected}
            disabled={disabled}
            onSelect={onSelect}
        >
            <Box style={{ color: "white", textAlign: "center", padding: 12 }}>
                <Box style={{ fontSize: 34, lineHeight: 1, marginBottom: 12, animation: selected ? "iconBounce 0.6s ease-in-out" : "none" }}>{style.icon}</Box>
                <Box style={{ fontSize: 22, lineHeight: 1.3, fontWeight: 700, overflowWrap: 'anywhere', textShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
                    <RichText>{answer.text}</RichText>
                </Box>
            </Box>
        </AnswerCardBase>
    );
}
