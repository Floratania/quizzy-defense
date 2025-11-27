import {Box, Stack} from '@mantine/core';
import {useLocation, useNavigate} from 'react-router-dom';
import {ADMIN_SIDEBAR_LINKS} from './admin-sidebar.constants.js';
import {NavbarLink} from "./NavbarLink.jsx";

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100vh',
        borderRight: '1px solid #e0e0e0',
        padding: '1rem 0',
      }}
    >
      <Stack spacing="md" align="center">
        {ADMIN_SIDEBAR_LINKS.map((link) => (
          <NavbarLink
            key={link.label}
            icon={link.icon}
            label={link.label}
            active={location.pathname.startsWith(link.to)}
            onClick={() => navigate(link.to)}
          />
        ))}
      </Stack>
    </Box>
  );
}
