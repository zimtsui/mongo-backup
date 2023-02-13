/// <reference types="node" />
import EventEmitter = require("events");
export declare class StateEventEmitter<Full, Delta = Full> extends EventEmitter {
    private ee;
    private eventName;
    private q;
    constructor(fullPromise: Promise<Full>, ee: EventEmitter, eventName: string | symbol, emitAs: string | symbol, after: (full: Full, delta: Delta) => boolean);
    private listener;
    close(): void;
}
