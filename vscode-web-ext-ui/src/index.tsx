import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';

import './index.css';
import App from './App';
import { AppState } from './AppState';

import { Theme } from './theme';

document.body.style.backgroundColor = Theme.palette.background.paper;

ReactDOM.render(
    <ThemeProvider theme={Theme} >
        <App state={new AppState()} />
    </ThemeProvider>,
    document.getElementById('root') as HTMLElement
);
