import { Tooltip, UnstyledButton } from '@mantine/core';

export function NavbarLink({ icon: _Icon, label, active, onClick }) {

    return (
        <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
            <UnstyledButton
                onClick={onClick}
                style={{
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
            </UnstyledButton>

        </Tooltip>
    );
}
