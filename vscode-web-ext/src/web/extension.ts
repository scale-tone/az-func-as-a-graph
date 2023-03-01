import * as vscode from 'vscode';
import { FileSystemWrapper } from './FileSystemWrapper';

import { FunctionGraphView } from './FunctionGraphView';

let graphViews: FunctionGraphView[] = [];

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(

		vscode.commands.registerCommand('az-func-as-a-graph.ShowGraph', async (item?: vscode.Uri) => {

			const fsWrapper = new FileSystemWrapper();

			if (!!item) {
				
				const pathToHostJson = item.toString();

				if (pathToHostJson.toLowerCase().endsWith('host.json')) {
					
					graphViews.push(new FunctionGraphView(context, vscode.Uri.parse(fsWrapper.dirName(pathToHostJson))));
				}

				return;
			}

			if (!vscode.workspace.workspaceFolders) {
				return;
			}

			let hostJsonFound = false;

			for (const folder of vscode.workspace.workspaceFolders) {

				const hostJsonPath = vscode.Uri.joinPath(folder.uri, 'host.json').toString();
				
				if (await fsWrapper.pathExists(hostJsonPath)) {
					
					graphViews.push(new FunctionGraphView(context, folder.uri));
					hostJsonFound = true;
				}
			}

			if (!hostJsonFound && !!vscode.workspace.workspaceFolders.length) {

				// Just trying the first workspace folder, in a hope that host.json is somewhere inside
				graphViews.push(new FunctionGraphView(context, vscode.workspace.workspaceFolders[0].uri));
			}
		})		
	);
}

// This method is called when your extension is deactivated
export function deactivate() {

	for (const view of graphViews) {
		
		view.cleanup();
	}
}