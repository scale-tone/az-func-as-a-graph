
import * as cp from 'child_process';
import * as util from 'util';

(util as any).promisify = (func => {

    if (func === cp.exec) {
        
        return (cmd) => {

            const res = cmd.startsWith('git rev-parse') ? 'my-branch' : 'https://user:password@github.com/my-org/my-repo';

            return Promise.resolve({ stdout: res });                
        }
    }
});

import { getGitRepoInfo } from '../cli/gitUtils';

test('getGitRepoInfo', async () => {

    const result = await getGitRepoInfo(__dirname);

    expect(result.originUrl).toBe('https://github.com/my-org/my-repo');
    expect(result.repoName).toBe('my-repo');
    expect(result.branchName).toBe('my-branch');
});
