import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router';

import '@mantine/core/styles.css';
import {MantineProvider} from '@mantine/core';
import router from "./routes/routesConfig.jsx";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <MantineProvider>
            <RouterProvider router={router} />
        </MantineProvider>
    </StrictMode>,
)
