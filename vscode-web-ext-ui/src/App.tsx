import React from 'react';
import { observer } from 'mobx-react';

import { AppBar, Box, Button, Checkbox, FormControlLabel, LinearProgress, Menu, MenuItem, Toolbar, Typography } from '@mui/material';

import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

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
            
            <Menu
                anchorEl={state.menuAnchorElement}
                keepMounted
                open={!!state.menuAnchorElement}
                onClose={() => state.menuAnchorElement = undefined}
            >
                <MenuItem
                    disabled={!state.diagramCode || state.inProgress}
                    onClick={() => state.copyToClipboard()}
                >
                    Copy diagram code to Clipboard
                </MenuItem>

                <MenuItem
                    disabled={!state.diagramSvg || state.inProgress}
                    onClick={() => state.saveAsSvg()}
                >
                    Save as .SVG
                </MenuItem>

                <MenuItem
                    disabled={!state.diagramSvg || state.inProgress}
                    onClick={() => state.saveAsJson()}
                >
                    Save as JSON
                </MenuItem>

            </Menu>

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

                    
                    <Typography style={{ flex: 1 }} />

                    <Button
                        className="toolbar-button"
                        variant="outlined"
                        color="inherit"
                        size="medium"
                        disabled={state.inProgress}
                        onClick={evt => state.menuAnchorElement = evt.currentTarget}
                    >
                        <SaveIcon />
                        <ArrowDropDownIcon />
                    </Button>

                    <Box width={10} />
                    
                    <Button
                        className="toolbar-button"
                        variant="outlined"
                        color="inherit"
                        size="medium"
                        disabled={state.inProgress}
                        onClick={() => state.refresh()}
                    >
                        <RefreshIcon />
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