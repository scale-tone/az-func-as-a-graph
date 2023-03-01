import React from 'react';
import { observer } from 'mobx-react';

import { AppBar, Box, Button, Checkbox, FormControlLabel, LinearProgress, Toolbar, Typography } from '@material-ui/core';

import RefreshIcon from '@material-ui/icons/Refresh';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import SaveIcon from '@material-ui/icons/Save';
import SaveAltIcon from '@material-ui/icons/SaveAlt';

import { CustomTabStyle } from './theme';
import { AppState } from './AppState';

@observer
export default class App extends React.Component<{ state: AppState }> {

    componentDidMount() {

        // Triggering initial load
        this.props.state.refresh();
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

            <AppBar color="inherit" position="static">
                <Toolbar>

                    <FormControlLabel
                        control={<Checkbox
                            color="default"
                            disabled={!state.functionsLoaded || state.inProgress}
                            checked={state.renderFunctions}
                            onChange={(evt) => state.renderFunctions = evt.target.checked}
                        />}
                        label="Show Functions"
                    />

                    <FormControlLabel
                        control={<Checkbox
                            color="default"
                            disabled={!state.functionsLoaded || state.inProgress}
                            checked={state.renderProxies}
                            onChange={(evt) => state.renderProxies = evt.target.checked}
                        />}
                        label="Show Proxies"
                    />
                    
                    <Box width={10} />

                    <Button
                        className="toolbar-button"
                        variant="outlined"
                        color="default"
                        size="small"
                        disabled={!state.diagramCode || state.inProgress}
                        onClick={() => {
                            window.navigator.clipboard.writeText(state.diagramCode);
                            state.showMessage('Diagram code was copied to Clipboard');
                        }}
                    >
                        <FileCopyIcon />
                        <Box width={5} />
                        <Typography color="inherit">Copy to Clipboard</Typography>
                    </Button>

                    <Box width={10} />

                    <Button
                        className="toolbar-button"
                        variant="outlined"
                        color="default"
                        size="small"
                        disabled={!state.diagramSvg || state.inProgress}
                        onClick={() => state.saveAsSvg()}
                    >
                        <SaveIcon />
                        <Box width={5} />
                        <Typography color="inherit">Save as .SVG</Typography>
                    </Button>

                    <Box width={10} />
                    
                    <Button
                        className="toolbar-button"
                        variant="outlined"
                        color="default"
                        size="small"
                        disabled={!state.diagramSvg || state.inProgress}
                        onClick={() => state.saveAsJson()}
                    >
                        <SaveAltIcon />
                        <Box width={5} />
                        <Typography color="inherit">Save as JSON</Typography>
                    </Button>

                    <Box width={10} />
                    
                    <Typography style={{ flex: 1 }} />
                    
                    <Button
                        className="toolbar-button"
                        variant="outlined"
                        color="default"
                        size="small"
                        disabled={state.inProgress}
                        onClick={() => state.refresh()}
                    >
                        <RefreshIcon />
                        <Box width={5} />
                        <Typography color="inherit">Refresh</Typography>
                    </Button>
                </Toolbar>
            </AppBar>

            {!!state.inProgress && (<LinearProgress />)}

            {!!state.diagramSvg && (<>
                
                <div className="diagram-div"
                    style={CustomTabStyle}
                    dangerouslySetInnerHTML={{ __html: state.diagramSvg }}
                />

            </>)}

        </>);
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