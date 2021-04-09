import { DefaultHttpClient, HttpRequest, HttpResponse, NullLogger } from '@aspnet/signalr';

import { IDurableEntitySetConfig } from './IDurableEntitySetConfig';
import { ClientPrincipalHeaderName } from '../shared/common/Constants';

export const BackendBaseUri = '/a/p/i';

// Custom HttpClient implementation for the purposes of DurableEntitySet
export class DurableHttpClient extends DefaultHttpClient {

    constructor(private _configFabric: () => IDurableEntitySetConfig) {
        super(NullLogger.instance);
    }

    send(request: HttpRequest): Promise<HttpResponse> {

        // Applying custom config settings, but only when calling our backend

        if (request.url!.includes(BackendBaseUri)) {

            const config = this._configFabric();

            if (!!config.accessTokenFactory) {
                return config.accessTokenFactory().then(accessToken => {

                    request.headers = {}
                    request.headers['Authorization'] = 'Bearer ' + accessToken;

                    return super.send(request);
                });
            }

            if (!!config.fakeUserNamePromise) {
                return config.fakeUserNamePromise.then(fakeUserName => {

                    if (!!fakeUserName) {
                        request.headers = {}
                        request.headers[ClientPrincipalHeaderName] = fakeUserName;
                    }

                    return super.send(request);
                });
            }
        }

        return super.send(request);
    }
}
