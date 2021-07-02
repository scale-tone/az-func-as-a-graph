import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

import { GitHubInfo } from '../ui/src/shared/FunctionsMap';

// Does a git clone into a temp folder and returns info about the repo
export async function CloneFromGitHub(url: string): Promise<GitHubInfo> {

    var orgUrl = '', repoName = '', branchName = '', relativePath = '', gitTempFolder = '';

    var restOfUrl = [];
    const match = /(https:\/\/github.com\/.*?)\/([^\/]+)(\/tree\/)?(.*)/i.exec(url);

    if (!match || match.length < 5) {

        url += '.git';

    } else {

        orgUrl = match[1];

        repoName = match[2];
        if (repoName.toLowerCase().endsWith('.git')) {
            repoName = repoName.substr(0, repoName.length - 4);
        }

        url = `${orgUrl}/${repoName}.git`;

        if (!!match[4]) {
            restOfUrl.push(...match[4].split('/'));
        }
    }

    gitTempFolder = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-clone-'));

    // The provided URL might contain both branch name and relative path. The only way to separate one from another
    // is to repeatedly try cloning assumed branch names, until we finally succeed.
    for (var i = restOfUrl.length; i > 0; i--) {

        try {

            const assumedBranchName = restOfUrl.slice(0, i).join('/');
            execSync(`git clone ${url} --branch ${assumedBranchName}`, { cwd: gitTempFolder });

            branchName = assumedBranchName;
            relativePath = path.join(...restOfUrl.slice(i, restOfUrl.length));

            break;
        } catch {
            continue;
        }
    }

    if (!branchName) {

        // Just doing a normal git clone
        execSync(`git clone ${url}`, { cwd: gitTempFolder });

        // And getting the current branch name (it might be different from default)
        branchName = execSync('git rev-parse --abbrev-ref HEAD', { env: { GIT_DIR: path.join(gitTempFolder, repoName, '.git') } }).toString();
    }

    return { orgUrl, repoName, branchName, relativePath, gitTempFolder };
}

// Primitive way of getting a line number out of symbol position
export function posToLineNr(code: string, pos: number): number {
    const lineBreaks = code.substr(0, pos).match(/(\r\n|\r|\n)/g);
    return !lineBreaks ? 1 : lineBreaks.length + 1;
}

// Checks if the given folder looks like a .Net project
export async function isDotNetProjectAsync(projectFolder: string): Promise<boolean> {
    return (await fs.promises.readdir(projectFolder)).some(fn => {
        fn = fn.toLowerCase();
        return (fn.endsWith('.sln')) ||
            (fn.endsWith('.fsproj')) ||
            (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
    });
}

// Complements regex's inability to keep up with nested brackets
export function getCodeInBrackets(str: string, startFrom: number, openingBracket: string, closingBracket: string, mustHaveSymbols: string): string {

    var bracketCount = 0, openBracketPos = 0, mustHaveSymbolFound = false;
    for (var i = startFrom; i < str.length; i++) {
        switch (str[i]) {
            case openingBracket:
                if (bracketCount <= 0) {
                    openBracketPos = i + 1;
                }
                bracketCount++;
                break;
            case closingBracket:
                bracketCount--;
                if (bracketCount <= 0 && mustHaveSymbolFound) {
                    return str.substring(startFrom, i);
                }
                break;
        }

        if (bracketCount > 0 && mustHaveSymbols.includes(str[i])) {
            mustHaveSymbolFound = true;
        }
    }
    return '';
}

// General-purpose regexes
export class TraversalRegexes {

    static getStartNewOrchestrationRegex(orchName: string): RegExp {
        return new RegExp(`(StartNew|StartNewAsync|start_new)(\\s*<[\\w\.-\\[\\]]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\.-]*)${orchName}\\s*["'\\)]{1}`, 'i');
    }

    static getCallSubOrchestratorRegex(subOrchName: string): RegExp {
        return new RegExp(`(CallSubOrchestrator|CallSubOrchestratorWithRetry|call_sub_orchestrator)(Async)?(\\s*<[\\w\.-\\[\\]]+>)?\\s*\\(\\s*(["'\`]|nameof\\s*\\(\\s*[\\w\.-]*)${subOrchName}\\s*["'\\)]{1}`, 'i');
    }

    static readonly continueAsNewRegex = new RegExp(`ContinueAsNew\\s*\\(`, 'i');

    static getRaiseEventRegex(eventName: string): RegExp {
        return new RegExp(`(RaiseEvent|raise_event)(Async)?(.|\r|\n)*${eventName}`, 'i');
    }

    static getSignalEntityRegex(entityName: string): RegExp {
        return new RegExp(`${entityName}\\s*["'>]{1}`);
    }

    static readonly waitForExternalEventRegex = new RegExp(`(WaitForExternalEvent|wait_for_external_event)(<[\\s\\w\.-\\[\\]]+>)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`])?([\\s\\w\.-]+)\\s*["'\`\\),]{1}`, 'gi');

    static getDotNetFunctionNameRegex(funcName: string): RegExp {
        return new RegExp(`FunctionName(Attribute)?\\s*\\(\\s*(nameof\\s*\\(\\s*|["'\`])${funcName}\\s*["'\`\\)]{1}`)
    }

    static getCallActivityRegex(activityName: string): RegExp {
        return new RegExp(`(CallActivity|call_activity)[\\s\\w\.-<>\\[\\]\\(]*\\([\\s\\w\.-]*["'\`]?${activityName}\\s*["'\`\\)]{1}`, 'i');
    }
}

// In .Net not all bindings are mentioned in function.json, so we need to analyze source code to extract them
export class DotNetBindingsParser {

    static tryExtractBindings(func: any): any[] {

        const result: any[] = [];

        if (!func.code) {
            return result;
        }

        const regex = this.returnAttributeRegex;
        var match: RegExpExecArray | null;
        while (!!(match = regex.exec(func.code))) {

            const isReturn = !!match[2];

            const attributeName = match[3];
            const attributeCode = getCodeInBrackets(func.code, match.index + match[0].length - 1, '(', ')', '"');

            switch (attributeName) {
                case 'Blob': {
                    const binding: any = { type: 'blob', direction: isReturn ? 'out' : 'inout' };

                    const paramsMatch = this.blobParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['path'] = paramsMatch[1];
                    }
                    result.push(binding);

                    break;
                }
                case 'Table': {
                    const binding: any = { type: 'table', direction: isReturn ? 'out' : 'inout' };

                    const paramsMatch = this.tableParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['tableName'] = paramsMatch[1];
                    }
                    result.push(binding);

                    break;
                }
                case 'CosmosDB': {
                    const binding: any = { type: 'cosmosDB', direction: isReturn ? 'out' : 'inout' };

                    const paramsMatch = this.cosmosDbParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['databaseName'] = paramsMatch[1];
                        binding['collectionName'] = paramsMatch[3];
                    }
                    result.push(binding);

                    break;
                }
                case 'SignalRConnectionInfo': {
                    const binding: any = { type: 'signalRConnectionInfo', direction: 'in' };

                    const paramsMatch = this.signalRConnInfoParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['hubName'] = paramsMatch[1];
                    }
                    result.push(binding);

                    break;
                }
                case 'EventGrid': {
                    const binding: any = { type: 'eventGrid', direction: 'out' };

                    const paramsMatch = this.eventGridParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['topicEndpointUri'] = paramsMatch[1];
                        binding['topicKeySetting'] = paramsMatch[3];
                    }
                    result.push(binding);

                    break;
                }
                case 'EventHub': {
                    const binding: any = { type: 'eventHub', direction: 'out' };

                    const paramsMatch = this.eventHubParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['eventHubName'] = paramsMatch[1];
                    }
                    result.push(binding);

                    break;
                }
                case 'Queue': {
                    const binding: any = { type: 'queue', direction: 'out' };

                    const paramsMatch = this.queueParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[1];
                    }
                    result.push(binding);

                    break;
                }
                case 'ServiceBus': {
                    const binding: any = { type: 'serviceBus', direction: 'out' };

                    const paramsMatch = this.serviceBusParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[1];
                    }
                    result.push(binding);

                    break;
                }
                case 'SignalR': {
                    const binding: any = { type: 'signalR', direction: 'out' };

                    const paramsMatch = this.signalRParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['hubName'] = paramsMatch[1];
                    }
                    result.push(binding);

                    break;
                }
                case 'RabbitMQ': {
                    const binding: any = { type: 'rabbitMQ', direction: 'out' };

                    const paramsMatch = this.rabbitMqParamsRegex.exec(attributeCode);
                    if (!!paramsMatch) {
                        binding['queueName'] = paramsMatch[1];
                    }
                    result.push(binding);

                    break;
                }
                case 'SendGrid': {
                    result.push({ type: 'sendGrid', direction: 'out' });
                    break;
                }
                case 'TwilioSms': {
                    result.push({ type: 'twilioSms', direction: 'out' });
                    break;
                }
            }
        }

        return result;
    }

    static readonly returnAttributeRegex = new RegExp(`\\[(<)?\\s*(return:)?\\s*(\\w+)(Attribute)?\\s*\\(`, 'g');
    static readonly blobParamsRegex = new RegExp(`"([^"]+)"`);
    static readonly tableParamsRegex = new RegExp(`"([^"]+)"`);
    static readonly cosmosDbParamsRegex = new RegExp(`"([^"]+)"(.|\r|\n)+?"([^"]+)"`);
    static readonly signalRConnInfoParamsRegex = new RegExp(`"([^"]+)"`);
    static readonly eventGridParamsRegex = new RegExp(`"([^"]+)"(.|\r|\n)+?"([^"]+)"`);
    static readonly eventHubParamsRegex = new RegExp(`"([^"]+)"`);
    static readonly queueParamsRegex = new RegExp(`"([^"]+)"`);
    static readonly serviceBusParamsRegex = new RegExp(`"([^"]+)"`);
    static readonly signalRParamsRegex = new RegExp(`"([^"]+)"`);
    static readonly rabbitMqParamsRegex = new RegExp(`"([^"]+)"`);
}
