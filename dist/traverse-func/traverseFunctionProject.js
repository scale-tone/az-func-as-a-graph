"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.traverseFunctionProject = void 0;
const os = require("os");
const fs = require("fs");
const path = require("path");
const child_process_1 = require("child_process");
const traverseFunctionProjectUtils_1 = require("./traverseFunctionProjectUtils");
const ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];
// fileName can be a regex, pattern should be a regex (which will be searched for in the matching files).
// If returnFileContents == true, returns file content. Otherwise returns full path to the file.
function findFileRecursivelyAsync(folder, fileName, returnFileContents, pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileNameRegex = new RegExp(fileName, 'i');
        for (const name of yield fs.promises.readdir(folder)) {
            var fullPath = path.join(folder, name);
            if ((yield fs.promises.lstat(fullPath)).isDirectory()) {
                if (ExcludedFolders.includes(name.toLowerCase())) {
                    continue;
                }
                const result = yield findFileRecursivelyAsync(fullPath, fileName, returnFileContents, pattern);
                if (!!result) {
                    return result;
                }
            }
            else if (!!fileNameRegex.exec(name)) {
                if (!pattern) {
                    return {
                        filePath: fullPath,
                        code: returnFileContents ? (yield fs.promises.readFile(fullPath, { encoding: 'utf8' })) : undefined
                    };
                }
                const code = yield fs.promises.readFile(fullPath, { encoding: 'utf8' });
                const match = pattern.exec(code);
                if (!!match) {
                    return {
                        filePath: fullPath,
                        code: returnFileContents ? code : undefined,
                        pos: match.index,
                        length: match[0].length
                    };
                }
            }
        }
        return undefined;
    });
}
// Tries to match orchestrations and their activities by parsing source code
function mapOrchestratorsAndActivitiesAsync(functions, projectFolder, hostJsonFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        const isDotNet = yield isDotNetProjectAsync(projectFolder);
        const functionNames = Object.keys(functions);
        const orchestratorNames = functionNames.filter(name => functions[name].bindings.some((b) => b.type === 'orchestrationTrigger'));
        const orchestrators = yield getFunctionsAndTheirCodesAsync(orchestratorNames, isDotNet, projectFolder, hostJsonFolder);
        const activityNames = Object.keys(functions).filter(name => functions[name].bindings.some((b) => b.type === 'activityTrigger'));
        const activities = yield getFunctionsAndTheirCodesAsync(activityNames, isDotNet, projectFolder, hostJsonFolder);
        const entityNames = functionNames.filter(name => functions[name].bindings.some((b) => b.type === 'entityTrigger'));
        const entities = yield getFunctionsAndTheirCodesAsync(entityNames, isDotNet, projectFolder, hostJsonFolder);
        const otherFunctionNames = functionNames.filter(name => !functions[name].bindings.some((b) => ['orchestrationTrigger', 'activityTrigger', 'entityTrigger'].includes(b.type)));
        const otherFunctions = yield getFunctionsAndTheirCodesAsync(otherFunctionNames, isDotNet, projectFolder, hostJsonFolder);
        for (const orch of orchestrators) {
            // Trying to match this orchestrator with its calling function
            const regex = traverseFunctionProjectUtils_1.TraversalRegexes.getStartNewOrchestrationRegex(orch.name);
            for (const func of otherFunctions) {
                // If this function seems to be calling that orchestrator
                if (!!regex.exec(func.code)) {
                    functions[orch.name].isCalledBy.push(func.name);
                }
            }
            // Matching suborchestrators
            for (const subOrch of orchestrators) {
                if (orch.name === subOrch.name) {
                    continue;
                }
                // If this orchestrator seems to be calling that suborchestrator
                const regex = traverseFunctionProjectUtils_1.TraversalRegexes.getCallSubOrchestratorRegex(subOrch.name);
                if (!!regex.exec(orch.code)) {
                    // Mapping that suborchestrator to this orchestrator
                    functions[subOrch.name].isCalledBy.push(orch.name);
                }
            }
            // Mapping activities to orchestrators
            mapActivitiesToOrchestrator(functions, orch, activityNames);
            // Checking whether orchestrator calls itself
            if (!!traverseFunctionProjectUtils_1.TraversalRegexes.continueAsNewRegex.exec(orch.code)) {
                functions[orch.name].isCalledByItself = true;
            }
            // Trying to map event producers with their consumers
            const eventNames = getEventNames(orch.code);
            for (const eventName of eventNames) {
                const regex = traverseFunctionProjectUtils_1.TraversalRegexes.getRaiseEventRegex(eventName);
                for (const func of otherFunctions) {
                    // If this function seems to be sending that event
                    if (!!regex.exec(func.code)) {
                        functions[orch.name].isSignalledBy.push({ name: func.name, signalName: eventName });
                    }
                }
            }
        }
        for (const entity of entities) {
            // Trying to match this entity with its calling function
            for (const func of otherFunctions) {
                // If this function seems to be calling that entity
                const regex = traverseFunctionProjectUtils_1.TraversalRegexes.getSignalEntityRegex(entity.name);
                if (!!regex.exec(func.code)) {
                    functions[entity.name].isCalledBy.push(func.name);
                }
            }
        }
        if (isDotNet) {
            for (const func of otherFunctions) {
                const moreBindings = traverseFunctionProjectUtils_1.DotNetBindingsParser.tryExtractBindings(func);
                functions[func.name].bindings.push(...moreBindings);
            }
        }
        // Also adding file paths and code positions
        for (const func of otherFunctions.concat(orchestrators).concat(activities).concat(entities)) {
            functions[func.name].filePath = func.filePath;
            functions[func.name].pos = func.pos;
            functions[func.name].lineNr = func.lineNr;
        }
        return functions;
    });
}
// Tries to extract event names that this orchestrator is awaiting
function getEventNames(orchestratorCode) {
    const result = [];
    const regex = traverseFunctionProjectUtils_1.TraversalRegexes.waitForExternalEventRegex;
    var match;
    while (!!(match = regex.exec(orchestratorCode))) {
        result.push(match[4]);
    }
    return result;
}
// Primitive way of getting a line number out of symbol position
function posToLineNr(code, pos) {
    const lineBreaks = code.substr(0, pos).match(/(\r\n|\r|\n)/g);
    return !lineBreaks ? 1 : lineBreaks.length + 1;
}
// Tries to load code for functions of certain type
function getFunctionsAndTheirCodesAsync(functionNames, isDotNet, projectFolder, hostJsonFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = functionNames.map((name) => __awaiter(this, void 0, void 0, function* () {
            const match = yield (isDotNet ?
                findFileRecursivelyAsync(projectFolder, '.+\.(f|c)s$', true, traverseFunctionProjectUtils_1.TraversalRegexes.getDotNetFunctionNameRegex(name)) :
                findFileRecursivelyAsync(path.join(hostJsonFolder, name), '(index\.ts|index\.js|__init__\.py)$', true));
            if (!match) {
                return undefined;
            }
            const code = !isDotNet ? match.code : traverseFunctionProjectUtils_1.getCodeInBrackets(match.code, match.pos + match.length, '{', '}', ' \n');
            const pos = !match.pos ? 0 : match.pos;
            const lineNr = posToLineNr(match.code, pos);
            return { name, code, filePath: match.filePath, pos, lineNr };
        }));
        return (yield Promise.all(promises)).filter(f => !!f);
    });
}
// Tries to match orchestrator with its activities
function mapActivitiesToOrchestrator(functions, orch, activityNames) {
    for (const activityName of activityNames) {
        // If this orchestrator seems to be calling this activity
        const regex = traverseFunctionProjectUtils_1.TraversalRegexes.getCallActivityRegex(activityName);
        if (!!regex.exec(orch.code)) {
            // Then mapping this activity to this orchestrator
            if (!functions[activityName].isCalledBy) {
                functions[activityName].isCalledBy = [];
            }
            functions[activityName].isCalledBy.push(orch.name);
        }
    }
}
function isDotNetProjectAsync(projectFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield fs.promises.readdir(projectFolder)).some(fn => {
            fn = fn.toLowerCase();
            return (fn.endsWith('.sln')) ||
                (fn.endsWith('.fsproj')) ||
                (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
        });
    });
}
// Collects all function.json files in a Functions project. Also tries to supplement them with bindings
// extracted from .Net code (if the project is .Net). Also parses and organizes orchestrators/activities 
// (if the project uses Durable Functions)
function traverseFunctionProject(projectFolder, log) {
    return __awaiter(this, void 0, void 0, function* () {
        var functions = {}, tempFolders = [], orgUrl = '', repoName = '', branchName = '';
        // If it is a git repo, cloning it
        if (projectFolder.toLowerCase().startsWith('http')) {
            var restOfUrl = [];
            const match = /(https:\/\/github.com\/.*?)\/([^\/]+)(\/tree\/)?(.*)/i.exec(projectFolder);
            if (!match || match.length < 5) {
                projectFolder += '.git';
            }
            else {
                orgUrl = match[1];
                repoName = match[2];
                if (repoName.toLowerCase().endsWith('.git')) {
                    repoName = repoName.substr(0, repoName.length - 4);
                }
                projectFolder = `${orgUrl}/${repoName}.git`;
                if (!!match[4]) {
                    restOfUrl.push(...match[4].split('/'));
                }
            }
            const gitTempFolder = yield fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-clone-'));
            tempFolders.push(gitTempFolder);
            var relativePath = '';
            log(`>>> Cloning ${projectFolder} to ${gitTempFolder}...`);
            // The provided URL might contain both branch name and relative path. The only way to separate one from another
            // is to repeatedly try cloning assumed branch names, until we finally succeed.
            for (var i = restOfUrl.length; i > 0; i--) {
                try {
                    const assumedBranchName = restOfUrl.slice(0, i).join('/');
                    child_process_1.execSync(`git clone ${projectFolder} --branch ${assumedBranchName}`, { cwd: gitTempFolder });
                    branchName = assumedBranchName;
                    relativePath = path.join(...restOfUrl.slice(i, restOfUrl.length));
                    break;
                }
                catch (_a) {
                    continue;
                }
            }
            if (!branchName) {
                // Just doing a normal git clone
                child_process_1.execSync(`git clone ${projectFolder}`, { cwd: gitTempFolder });
                // And getting the current branch name (it might be different from default)
                branchName = child_process_1.execSync('git rev-parse --abbrev-ref HEAD', { env: { GIT_DIR: path.join(gitTempFolder, repoName, '.git') } }).toString();
            }
            projectFolder = path.join(gitTempFolder, repoName, relativePath);
        }
        const hostJsonMatch = yield findFileRecursivelyAsync(projectFolder, 'host.json', false);
        if (!hostJsonMatch) {
            throw new Error('host.json file not found under the provided project path');
        }
        log(`>>> Found host.json at ${hostJsonMatch.filePath}`);
        var hostJsonFolder = path.dirname(hostJsonMatch.filePath);
        // If it is a C# function, we'll need to dotnet publish first
        if (yield isDotNetProjectAsync(hostJsonFolder)) {
            const publishTempFolder = yield fs.promises.mkdtemp(path.join(os.tmpdir(), 'dotnet-publish-'));
            tempFolders.push(publishTempFolder);
            log(`>>> Publishing ${hostJsonFolder} to ${publishTempFolder}...`);
            child_process_1.execSync(`dotnet publish -o ${publishTempFolder}`, { cwd: hostJsonFolder });
            hostJsonFolder = publishTempFolder;
        }
        const promises = (yield fs.promises.readdir(hostJsonFolder)).map((functionName) => __awaiter(this, void 0, void 0, function* () {
            const fullPath = path.join(hostJsonFolder, functionName);
            const functionJsonFilePath = path.join(fullPath, 'function.json');
            if (!!(yield fs.promises.lstat(fullPath)).isDirectory() && !!fs.existsSync(functionJsonFilePath)) {
                try {
                    const functionJsonString = yield fs.promises.readFile(functionJsonFilePath, { encoding: 'utf8' });
                    const functionJson = JSON.parse(functionJsonString);
                    functions[functionName] = { bindings: functionJson.bindings, isCalledBy: [], isSignalledBy: [] };
                }
                catch (err) {
                    log(`>>> Failed to parse ${functionJsonFilePath}: ${err}`);
                }
            }
        }));
        yield Promise.all(promises);
        functions = yield mapOrchestratorsAndActivitiesAsync(functions, projectFolder, hostJsonFolder);
        return { functions, orgUrl, repoName, branchName, tempFolders };
    });
}
exports.traverseFunctionProject = traverseFunctionProject;
//# sourceMappingURL=traverseFunctionProject.js.map