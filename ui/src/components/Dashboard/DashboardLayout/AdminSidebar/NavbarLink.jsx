import { Badge, Tooltip, UnstyledButton } from '@mantine/core';

export function NavbarLink({ icon: _Icon, label, active, onClick, count = 0 }) {

    return (
        <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
            <UnstyledButton
                onClick={onClick}
                aria-label={count ? `${label}: ${count} заявок` : label}
                style={{
                    position: 'relative',
                    width: 50,
                    height: 50,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: active
                        ? 'linear-gradient(135deg, #93c5fd 0%, #c084fc 100%)'
                        : 'transparent',
                    color: active ? 'white' : 'black',
                }}
            >
                <_Icon size={20} stroke={1.5} />
                {count>0&&<Badge color="orange" size="xs" style={{position:"absolute",top:0,right:-3}}>{count}</Badge>}
            </UnstyledButton>

        </Tooltip>
    );
}
