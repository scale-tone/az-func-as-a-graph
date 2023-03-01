import { createMuiTheme } from '@material-ui/core';

// Config object passed as a global variable via index.html
declare const ClientConfig: {
    theme: string
};

export const Theme = createMuiTheme({
    palette: { type: ClientConfig.theme === 'dark' ? 'dark' : 'light' }
});

export const CustomTabStyle = Theme.palette.type === 'dark' ? {
    backgroundColor: '#aaa'
} : {};