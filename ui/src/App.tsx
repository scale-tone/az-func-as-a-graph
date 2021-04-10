import React from 'react';
import { observer } from 'mobx-react';

import { AppBar, Box, Button, LinearProgress, TextField, Toolbar, Typography } from '@material-ui/core';

import FileCopyIcon from '@material-ui/icons/FileCopy';
import SaveIcon from '@material-ui/icons/Save';

import { AppState } from './AppState';

@observer
export default class App extends React.Component<{ state: AppState }> {

    componentDidMount() {

        if (window.location.search.startsWith('?path=')) {
         
            const state = this.props.state;
            state.pathText = decodeURIComponent(window.location.search.substr(6));
            state.load();
        }
    }

    render(): JSX.Element {
        const state = this.props.state;

        return (<>
            <AppBar position="static" color="default">
                <Toolbar>

                    <Typography variant="h5" color="inherit" className="title-typography">
                        Azure Functions as a Graph
                    </Typography>

                    <TextField
                        fullWidth
                        className="filter-textfield"
                        margin="dense"
                        label="GitHub link or local path to Functions project"
                        InputLabelProps={{ shrink: true }}
                        placeholder="e.g. 'https://github.com/scale-tone/repka-durable-func'"
                        disabled={state.inProgress}
                        value={state.pathText}
                        onChange={(evt) => state.pathText = evt.target.value as string}
                        onKeyPress={(evt: React.KeyboardEvent<HTMLInputElement>) => this.handleKeyPress(evt)}
                    />

                    <Box width={30} />

                    <Button
                        className="filter-button"
                        variant="outlined"
                        color="secondary"
                        size="large"
                        disabled={state.inProgress || !state.pathText}
                        onClick={() => state.load()}
                    >
                        Visualize
                    </Button>
                </Toolbar>
            </AppBar>

            {!!state.inProgress && (<LinearProgress />)}

            {!!state.error && (<Typography className="error-typography" color="error" variant="h5" >{state.error}</Typography>)}

            {!!state.diagramSvg && (<>
                <div className="diagram-div"
                    dangerouslySetInnerHTML={{ __html: state.diagramSvg }}
                />

                <Toolbar variant="dense" className="bottom-toolbar">

                    <Button
                        variant="outlined"
                        color="default"
                        disabled={state.inProgress}
                        onClick={() => window.navigator.clipboard.writeText(state.diagramCode)}
                    >
                        <FileCopyIcon />
                        <Box width={10} />
                        <Typography color="inherit">Copy diagram code to Clipboard</Typography>
                    </Button>

                    <Box width={20} />

                    <Button
                        variant="outlined"
                        color="default"
                        disabled={state.inProgress}
                        href={URL.createObjectURL(new Blob([state.diagramSvg], { type: 'image/svg+xml' }))}
                        download={'functions.svg'}
                    >
                        <SaveIcon />
                        <Box width={20} />
                        <Typography color="inherit">Save as .SVG</Typography>
                    </Button>

                    <Box width={20} />
                </Toolbar>
            </>)}

            <a className="github-link" href="https://github.com/scale-tone/az-func-as-a-graph" target="_blank" rel="noreferrer">
                <img loading="lazy" width="149" height="149" src="https://github.blog/wp-content/uploads/2008/12/forkme_right_white_ffffff.png?resize=149%2C149" alt="Fork me on GitHub" data-recalc-dims="1" />
            </a>

        </>);
    }

    private handleKeyPress(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            // Otherwise the event will bubble up and the form will be submitted
            event.preventDefault();

            this.props.state.load();
        }
    }
}
