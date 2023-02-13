"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateEventEmitter = void 0;
const EventEmitter = require("events");
const semque_1 = require("./semque");
class StateEventEmitter extends EventEmitter {
    constructor(fullPromise, ee, eventName, emitAs, after) {
        super();
        this.ee = ee;
        this.eventName = eventName;
        this.q = new semque_1.Semque();
        this.listener = (delta) => this.q.push(delta);
        ee.on(eventName, this.listener);
        ee.on('error', (...params) => this.emit('error', ...params));
        (async () => {
            const full = await fullPromise;
            let started = false;
            for (;;) {
                const delta = await this.q.pop();
                started || (started = after(full, delta));
                if (started)
                    this.emit(emitAs, delta);
            }
        })().catch(err => {
            if (err instanceof Closed)
                return;
            console.error(err);
        });
    }
    close() {
        this.ee.off(this.eventName, this.listener);
        this.q.throw(new Closed());
    }
}
exports.StateEventEmitter = StateEventEmitter;
class Closed extends Error {
}
//# sourceMappingURL=state-event-emitter.js.map