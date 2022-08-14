import React from 'react';
import { observer } from 'mobx-react';

import { AppBar, Box, Button, Checkbox, FormControlLabel, FormGroup, LinearProgress, Link, TextField, Toolbar, Typography } from '@material-ui/core';

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

    componentDidUpdate() {

        // Mounting click handlers to diagram nodes
        const svgElement = document.getElementById('mermaidSvgId');

        if (!!svgElement) {

            this.mountClickEventToFunctionNodes(svgElement.getElementsByClassName('function'));
            this.mountClickEventToFunctionNodes(svgElement.getElementsByClassName('orchestrator'));
            this.mountClickEventToFunctionNodes(svgElement.getElementsByClassName('activity'));
            this.mountClickEventToFunctionNodes(svgElement.getElementsByClassName('entity'));
            this.mountClickEventToFunctionNodes(svgElement.getElementsByClassName('proxy'));
        }
    }

    render(): JSX.Element {
        const state = this.props.state;

        return (<>

            <AppBar position="static" color="default">
                <Toolbar>

                    <Typography variant="h5" color="inherit" className="title-typography">
                        <Link color="inherit" href={window.location.origin + window.location.pathname}>
                            Azure Functions as a Graph
                        </Link>
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

            {!!state.functionsLoaded && (
                <FormGroup row className="settings-group">

                    <FormControlLabel
                        control={<Checkbox
                            color="default"
                            disabled={state.inProgress}
                            checked={state.renderFunctions}
                            onChange={(evt) => state.renderFunctions = evt.target.checked}
                        />}
                        label="Show Functions"
                    />

                    <FormControlLabel
                        control={<Checkbox
                            color="default"
                            disabled={state.inProgress}
                            checked={state.renderProxies}
                            onChange={(evt) => state.renderProxies = evt.target.checked}
                        />}
                        label="Show Proxies"
                    />

                </FormGroup>
            )}
            
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

            <a className="github-link" href="https://github.com/scale-tone/az-func-as-a-graph#az-func-as-a-graph" target="_blank" rel="noreferrer">
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

    private mountClickEventToFunctionNodes(nodes: HTMLCollection): void {

        const state = this.props.state;

        for (var i = 0; i < nodes.length; i++) {
            const el = nodes[i] as HTMLElement;

            const match = /flowchart-(.+)-/.exec(el.id);
            if (!!match) {

                const closuredFunctionName = match[1];
                el.onclick = () => state.gotoFunctionCode(closuredFunctionName);
                el.style.cursor = 'pointer';
            }
        }
    }
}