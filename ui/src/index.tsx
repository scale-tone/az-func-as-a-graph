import React from 'react';
import ReactDOM from 'react-dom';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import red from '@mui/material/colors/red';
import blue from '@mui/material/colors/blue';

import './index.css';
import App from './App';
import { AppState } from './AppState';

const theme = createTheme({
    palette: {
        primary: blue,
        secondary: red
    },
});

ReactDOM.render(<ThemeProvider theme={theme}><App state={new AppState()} /></ThemeProvider>, document.getElementById('root'));
