
import * as cp from 'child_process';

import { getGitRepoInfo } from '../cli/renderDiagramWithCli';

test('getGitRepoInfo', () => {

    (cp as any).execSync = (cmd) => cmd.startsWith('git rev-parse') ? 'my-branch' : 'https://user:password@github.com/my-org/my-repo';

    const result = getGitRepoInfo(__dirname);

    expect(result.originUrl).toBe('https://github.com/my-org/my-repo');
    expect(result.repoName).toBe('my-repo');
    expect(result.branchName).toBe('my-branch');
});
