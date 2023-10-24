import { GraphSettings } from './FunctionsMap';
import { GitRepositoryInfo } from './gitUtils';
export declare type GraphCliSettings = GraphSettings & {
    templateFile?: string;
    htmlTemplateFile?: string;
    repoInfo?: GitRepositoryInfo;
    sourcesRootFolder?: string;
};
export declare function renderDiagram(projectFolder: string, outputFile?: string, settings?: GraphCliSettings, log?: (s: any) => void): Promise<void>;
export declare function applyIcons(svg: string): Promise<string>;
