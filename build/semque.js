"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Semque = void 0;
const coroutine_locks_1 = require("@zimtsui/coroutine-locks");
class Semque {
    constructor() {
        this.sem = new coroutine_locks_1.Semaphore();
        this.queue = [];
    }
    push(x) {
        this.queue.push(x);
        this.sem.v();
    }
    async pop() {
        await this.sem.p();
        return this.queue.pop();
    }
}
exports.Semque = Semque;
//# sourceMappingURL=semque.js.map