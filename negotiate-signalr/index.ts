import { Context, HttpRequest } from "@azure/functions"

// SignalR connection negotiation method. The name is predefined.
export default async function (context: Context, req: HttpRequest, connectionInfo): Promise<void> {
    context.res = { body: connectionInfo };
};