import * as vscode from 'vscode';
import { FileSystemWrapper } from './FileSystemWrapper';

import { FunctionGraphView } from './FunctionGraphView';

let graphViews: FunctionGraphView[] = [];

const fsWrapper = new FileSystemWrapper();

const MaxProjectsToShowAutomatically = 5;

async function showAllFunctionProjects(context: vscode.ExtensionContext) {

	if (!vscode.workspace.workspaceFolders) {
		return;
	}

	const hostJsonFolders = [];

	try{

		for (const folder of vscode.workspace.workspaceFolders) {

			for await (const hostJsonPath of fsWrapper.findFilesRecursivelyAsync(folder.uri.toString(), new RegExp('host.json', 'i'))) {
				
				hostJsonFolders.push(fsWrapper.dirName(hostJsonPath));
			}
		}

		if (hostJsonFolders.length > MaxProjectsToShowAutomatically) {
			
			const userResponse = await vscode.window.showWarningMessage(
				`az-func-as-a-graph found ${hostJsonFolders.length} Azure Functions projects in current workspace. Do you want to visualize all of them?`,
				'Yes', 'No');

			if (userResponse !== 'Yes') {
				return;
			}
		}

	} catch (err: any) {
		
		vscode.window.showErrorMessage(`az-func-as-a-graph failed. ${err.message ?? err}`);
	}

	for (const hostJsonFolder of hostJsonFolders) {
		
		graphViews.push(new FunctionGraphView(context, vscode.Uri.parse(hostJsonFolder)));
	}
}

export async function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(

		vscode.commands.registerCommand('az-func-as-a-graph.ShowGraph', async (item?: vscode.Uri) => {

			if (!!item) {
				
				const pathToHostJson = item.toString();

				if (pathToHostJson.toLowerCase().endsWith('host.json')) {
					
					graphViews.push(new FunctionGraphView(context, vscode.Uri.parse(fsWrapper.dirName(pathToHostJson))));
				}

				return;
			}

			await showAllFunctionProjects(context);
		})		
	);

	if (!vscode.workspace.workspaceFolders) {
		return;
	}

    const config = vscode.workspace.getConfiguration('az-func-as-a-graph');

	if (!!config.get<boolean>('showGraphAtStartup', true)) {

		// Showing graphs of all Functions in the workspace
		await showAllFunctionProjects(context);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {

	for (const view of graphViews) {
		
		view.cleanup();
	}
}