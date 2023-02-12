/// <reference types="node" />
import EventEmitter = require("events");
export declare function events2Stream<Payload>(ee: EventEmitter, eventName: string | symbol): Promise<AsyncGenerator<Payload, void>>;
