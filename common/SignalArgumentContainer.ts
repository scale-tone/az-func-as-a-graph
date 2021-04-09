
export class SignalClientMetadata {
    callingUser?: string;
    correlationId?: string;
}

// A wrapper around signal's argument
export class SignalArgumentContainer {
    argument: any;
    __client_metadata: SignalClientMetadata = {};
}