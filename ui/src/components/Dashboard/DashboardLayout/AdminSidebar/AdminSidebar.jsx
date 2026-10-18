import {useEffect,useState} from 'react';
import apiClient from '../../../../api/apiClient.js';
import {useAuthContext} from '../../../../context/AuthContext.jsx';
import {IconUsers} from '@tabler/icons-react';
import {Box, Stack} from '@mantine/core';
import {useLocation, useNavigate} from 'react-router-dom';
import {ADMIN_SIDEBAR_LINKS} from './admin-sidebar.constants.js';
import {NavbarLink} from "./NavbarLink.jsx";

export function AdminSidebar() {
  const navigate = useNavigate();
  const {user}=useAuthContext();
  const [requestCount,setRequestCount]=useState(0);
  useEffect(()=>{
    if(user?.role!=='ADMIN')return;
    let active=true;
    apiClient.get('/account/teacher-requests').then(({data})=>{if(active)setRequestCount(data.length);}).catch(()=>{});
    const update=e=>setRequestCount(e.detail.length);
    window.addEventListener('teacher-requests-updated',update);
    return()=>{active=false;window.removeEventListener('teacher-requests-updated',update);};
  },[user?.id,user?.role]);
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
        {[...ADMIN_SIDEBAR_LINKS,...(user?.role==='ADMIN'?[{icon:IconUsers,label:'Користувачі',to:'/admin/users'}]:[])].map((link) => (
          <NavbarLink
            key={link.label}
            icon={link.icon}
            label={link.label}
            count={link.to==='/admin/users'?requestCount:0}
            active={location.pathname.startsWith(link.to)}
            onClick={() => navigate(link.to)}
          />
        ))}
      </Stack>
    </Box>
  );
}
