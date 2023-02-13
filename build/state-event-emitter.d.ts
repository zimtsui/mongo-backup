/// <reference types="node" />
import EventEmitter = require("events");
export declare class StateEventEmitter<Full, Delta = Full> extends EventEmitter {
    private ee;
    private event;
    private q;
    constructor(fullPromise: Promise<Full>, ee: EventEmitter, event: string | symbol, before: (full: Full, delta: Delta) => boolean);
    private listener;
    close(): void;
}
interface Events<State> {
    state(state: State): void;
    error(...params: any[]): void;
}
export interface StateEventEmitter<Full, Delta = Full> extends EventEmitter {
    on<Event extends keyof Events<Delta>>(event: Event, listener: Events<Delta>[Event]): this;
    once<Event extends keyof Events<Delta>>(event: Event, listener: Events<Delta>[Event]): this;
    off<Event extends keyof Events<Delta>>(event: Event, listener: Events<Delta>[Event]): this;
    emit<Event extends keyof Events<Delta>>(event: Event, ...params: Parameters<Events<Delta>[Event]>): boolean;
}
export {};
