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
const os = require("os");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const child_process_1 = require("child_process");
const ExcludedFolders = ['node_modules', 'obj', '.vs', '.vscode', '.env', '.python_packages', '.git', '.github'];
// fileName can be a regex, pattern should be a regex (which will be searched for in the matching files)
function findFileRecursively(folder, fileName, pattern) {
    const nameRegex = new RegExp(fileName, 'i');
    for (const name of fs.readdirSync(folder)) {
        var fullPath = path.join(folder, name);
        if (fs.lstatSync(fullPath).isDirectory()) {
            if (ExcludedFolders.includes(name.toLowerCase())) {
                continue;
            }
            fullPath = findFileRecursively(fullPath, fileName, pattern);
            if (!!fullPath) {
                return fullPath;
            }
        }
        else if (!!nameRegex.exec(name)) {
            if (!pattern) {
                return fullPath;
            }
            const code = fs.readFileSync(fullPath, { encoding: 'utf8' });
            if (!!new RegExp(pattern).exec(code)) {
                return fullPath;
            }
        }
    }
    return undefined;
}
// Tries to match orchestrations and their activities by parsing source code
function mapActivitiesToOrchestrators(functions, projectFolder, hostJsonFolder) {
    const isDotNet = isDotNetProject(projectFolder);
    const activityNames = Object.keys(functions).filter(name => functions[name].bindings.some(b => b.type === 'activityTrigger'));
    const orchNames = Object.keys(functions).filter(name => functions[name].bindings.some(b => b.type === 'orchestrationTrigger'));
    for (const orchName of orchNames) {
        var orchFileName = '';
        if (isDotNet) {
            orchFileName = findFileRecursively(projectFolder, '.+\.cs$', `FunctionName\\((nameof)?["'\`\\(]?${orchName}["'\`\\)]{1}`);
        }
        else {
            orchFileName = findFileRecursively(path.join(hostJsonFolder, orchName), 'index\.ts|index\.js|__init__\.py');
        }
        if (!orchFileName) {
            continue;
        }
        const orchCode = fs.readFileSync(orchFileName, { encoding: 'utf8' });
        for (const activityName of activityNames) {
            // If this orchestrator seems to be calling this activity
            const regex = new RegExp(`\\(\s*["'\`]?${activityName}["'\`\\)]{1}`);
            if (!!regex.exec(orchCode)) {
                if (!functions[orchName].activities) {
                    functions[orchName].activities = {};
                }
                functions[orchName].activities[activityName] = functions[activityName];
                delete functions[activityName];
            }
        }
    }
    return functions;
}
function isDotNetProject(projectFolder) {
    return fs.readdirSync(projectFolder).some(fn => {
        fn = fn.toLowerCase();
        return (fn.endsWith('.sln')) || (fn.endsWith('.csproj') && fn !== 'extensions.csproj');
    });
}
// Main function
function default_1(context, req) {
    return __awaiter(this, void 0, void 0, function* () {
        var publishTempFolder, gitTempFolder;
        try {
            var projectFolder = req.body;
            // If it is a git repo, cloning it
            if (projectFolder.toLowerCase().startsWith('http')) {
                var projectPath = [];
                // Trying to infer project path
                if (!projectFolder.toLowerCase().endsWith('.git')) {
                    const match = /(https:\/\/github.com\/.*?)\/([^\/]+)\/tree\/[^\/]+\/(.*)/i.exec(projectFolder);
                    if (!match || match.length < 4) {
                        projectFolder += '.git';
                    }
                    else {
                        projectFolder = `${match[1]}/${match[2]}.git`;
                        projectPath.push(match[2]);
                        projectPath.push(...match[3].split('/'));
                    }
                }
                gitTempFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'git-clone-'));
                context.log(`>>> Cloning ${projectFolder} to ${gitTempFolder}...`);
                child_process_1.execSync(`git clone ${projectFolder}`, { cwd: gitTempFolder });
                projectFolder = path.join(gitTempFolder, ...projectPath);
            }
            const hostJsonPath = findFileRecursively(projectFolder, 'host.json');
            if (!hostJsonPath) {
                throw new Error('host.json file not found under the provided project path');
            }
            context.log(`>>> Found host.json at ${hostJsonPath}`);
            var hostJsonFolder = path.dirname(hostJsonPath);
            // If it is a C# function, we'll need to dotnet publish first
            if (isDotNetProject(hostJsonFolder)) {
                publishTempFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'dotnet-publish-'));
                context.log(`>>> Publishing ${hostJsonFolder} to ${publishTempFolder}...`);
                child_process_1.execSync(`dotnet publish -o ${publishTempFolder}`, { cwd: hostJsonFolder });
                hostJsonFolder = publishTempFolder;
            }
            const result = {};
            for (const functionName of fs.readdirSync(hostJsonFolder)) {
                const fullPath = path.join(hostJsonFolder, functionName);
                const functionJsonFilePath = path.join(fullPath, 'function.json');
                if (!fs.lstatSync(fullPath).isDirectory() || !fs.existsSync(functionJsonFilePath)) {
                    continue;
                }
                try {
                    const functionJson = JSON.parse(fs.readFileSync(functionJsonFilePath, { encoding: 'utf8' }));
                    result[functionName] = { bindings: functionJson.bindings };
                }
                catch (err) {
                    context.log(`>>> Failed to parse ${functionJsonFilePath}: ${err}`);
                }
            }
            context.res = {
                body: mapActivitiesToOrchestrators(result, projectFolder, hostJsonFolder)
            };
        }
        catch (err) {
            context.log(`>>> Failed: ${err}`);
            context.res = {
                status: 500,
                body: err.message
            };
        }
        finally {
            if (!!publishTempFolder) {
                rimraf.sync(publishTempFolder);
            }
            if (!!gitTempFolder) {
                rimraf.sync(gitTempFolder);
            }
        }
    });
}
exports.default = default_1;
;
//# sourceMappingURL=index.js.map