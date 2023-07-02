import { createTheme } from '@mui/material';

// Config object passed as a global variable via index.html
declare const ClientConfig: {
    theme: string
};

export const Theme = createTheme({

    palette: { mode: ClientConfig.theme === 'dark' ? 'dark' : 'light' }
});

export const CustomTabStyle = Theme.palette.mode === 'dark' ? {
    backgroundColor: '#aaa'
} : {};