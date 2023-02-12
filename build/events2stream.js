"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.events2Stream = void 0;
const semque_1 = require("./semque");
async function events2Stream(ee, eventName) {
    async function* makeStream() {
        const semque = new semque_1.Semque();
        const listener = (payload) => {
            semque.push(payload);
        };
        ee.on(eventName, listener);
        try {
            yield null;
            for (;;)
                yield await semque.pop();
        }
        finally {
            ee.off(eventName, listener);
        }
    }
    const stream = makeStream();
    await stream.next();
    return stream;
}
exports.events2Stream = events2Stream;
//# sourceMappingURL=events2stream.js.map