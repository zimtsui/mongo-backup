"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const event_buffer_1 = require("./event-buffer");
/*
    在第一个状态到来之前关闭，会导致未定义的结果。
 */
class StateStream extends EventEmitter {
    constructor(currentPromise, ee, event, before) {
        super();
        this.currentPromise = currentPromise;
        this.before = before;
        this.eb = new event_buffer_1.default(ee, event);
        this.ebError = new event_buffer_1.default(ee, 'error');
        this.open();
    }
    async open() {
        let current;
        try {
            current = await this.currentPromise;
        }
        catch (error) {
            this.emit('error', error);
            return;
        }
        this.emit('state', current);
        this.eb.flush();
        this.ebError.flush();
        let started = false;
        this.eb.on('event', state => {
            if (started || (started = this.before(current, state)))
                this.emit('state', state);
        });
        this.ebError.on('event', error => void this.emit('error', error));
    }
    close() {
        this.eb.close();
        this.ebError.close();
    }
}
exports.default = StateStream;
//# sourceMappingURL=index.js.map