"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateEventEmitter = void 0;
const EventEmitter = require("events");
const semque_1 = require("./semque");
class StateEventEmitter extends EventEmitter {
    constructor(fullPromise, ee, event, before) {
        super();
        this.ee = ee;
        this.event = event;
        this.q = new semque_1.default();
        this.listener = (state) => void this.q.push(state);
        ee.on(event, this.listener);
        ee.on('error', (...params) => this.emit('error', ...params));
        (async () => {
            const full = await fullPromise;
            let started = false;
            for (;;) {
                const delta = await this.q.pop();
                if (started || (started = before(full, delta)))
                    this.emit('state', delta);
            }
        })().catch(err => {
            if (err instanceof Closed)
                return;
            console.error(err);
        });
    }
    close() {
        this.ee.off(this.event, this.listener);
        this.q.throw(new Closed());
    }
}
exports.StateEventEmitter = StateEventEmitter;
class Closed extends Error {
}
//# sourceMappingURL=state-event-emitter.js.map