"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const semque_1 = require("../semque");
class EventBuffer extends EventEmitter {
    constructor(ee, event) {
        super();
        this.ee = ee;
        this.event = event;
        this.q = new semque_1.default();
        this.pipe = (...params) => void this.q.push(params);
        this.ee.on(this.event, this.pipe);
    }
    async flush() {
        try {
            for (;;) {
                const params = await this.q.pop();
                this.emit('event', ...params);
            }
        }
        catch (err) {
            if (err instanceof EventBuffer.Closed)
                return;
            throw err;
        }
    }
    close() {
        this.ee.off(this.event, this.pipe);
        this.q.throw(new EventBuffer.Closed());
    }
}
(function (EventBuffer) {
    class Closed extends Error {
    }
    EventBuffer.Closed = Closed;
})(EventBuffer || (EventBuffer = {}));
exports.default = EventBuffer;
//# sourceMappingURL=event-buffer.js.map