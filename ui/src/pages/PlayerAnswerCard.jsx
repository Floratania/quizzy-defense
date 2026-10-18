import { Paper, Box } from "@mantine/core";

const ANSWER_COLORS = [
    { gradient: ['#60a5fa', '#3b82f6'], icon: '△' },  // Blue
    { gradient: ['#34d399', '#10b981'], icon: '◇' },  // Green
    { gradient: ['#fbbf24', '#f59e0b'], icon: '○' },  // Yellow
    { gradient: ['#f87171', '#ef4444'], icon: '□' },  // Red
    { gradient: ['#a78bfa', '#8b5cf6'], icon: '⬡' },  // Purple
    { gradient: ['#fb7185', '#ec4899'], icon: '★' }   // Pink
];

export function PlayerAnswerCard({
                                     answer,
                                     index,
                                     selected,
                                     disabled,
                                     onSelect
                                 }) {
    const colorStyle = ANSWER_COLORS[index % ANSWER_COLORS.length];
    const clickable = !!onSelect && !disabled;

    return (
        <Paper
            shadow={selected ? "2xl" : "xl"}
            radius="xl"
            onClick={() => clickable && onSelect(answer.id)}
            style={{
                cursor: clickable ? "pointer" : "default",
                background: `linear-gradient(135deg, ${colorStyle.gradient[0]}, ${colorStyle.gradient[1]})`,
                width: '100%',
                height: '100%',
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                transform: selected ? "scale(0.98)" : "scale(1)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                border: selected ? "8px solid white" : "none",
                opacity: disabled && !selected ? 0.4 : 1,
                position: 'relative',
                boxShadow: selected
                    ? '0 25px 50px rgba(0,0,0,0.25)'
                    : '0 15px 35px rgba(0,0,0,0.15)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
                if (clickable && !selected) {
                    e.currentTarget.style.transform = "scale(0.98)";
                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.2)";
                }
            }}
            onMouseLeave={(e) => {
                if (!selected) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.15)";
                }
            }}
        >
            <Box
                style={{
                    color: "white",
                    textAlign: "center",
                    textShadow: "0 8px 16px rgba(0,0,0,0.3)",
                    animation: selected ? "iconPulse 0.6s ease-in-out" : "none",
                    userSelect: 'none',
                    padding: '1rem'
                }}
            >
                <Box style={{ fontSize: 'clamp(32px, 5vw, 58px)', lineHeight: 1, marginBottom: 14 }}>{colorStyle.icon}</Box>
                <Box style={{ fontSize: 'clamp(18px, 2.5vw, 32px)', lineHeight: 1.25, fontWeight: 700, overflowWrap: 'anywhere' }}>{answer.text}</Box>
            </Box>

            {/* Selection overlay with pulse */}
            {selected && (
                <>
                    <Box
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)',
                            pointerEvents: 'none',
                            animation: 'pulseOverlay 1.5s ease-in-out infinite'
                        }}
                    />

                    {/* Checkmark */}
                    <Box
                        style={{
                            position: 'absolute',
                            top: '5%',
                            right: '5%',
                            fontSize: 'clamp(48px, 10vw, 80px)',
                            color: 'white',
                            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                            animation: 'checkBounce 0.6s ease-in-out',
                            userSelect: 'none'
                        }}
                    >
                        ✓
                    </Box>
                </>
            )}

            {/* Subtle shine effect on hover */}
            <Box
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%)',
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 0.3s'
                }}
                className="shine-effect"
            />
        </Paper>
    );
}
