"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Get = void 0;
const mongodb_1 = require("mongodb");
const assert = require("assert");
const EventEmitter = require("events");
const events2stream_1 = require("../events2stream");
// interface Query extends Readonly<Record<string, string>> {
// 	readonly id: string;
// }
class Get {
    constructor(host, db, coll, stream) {
        this.host = host;
        this.db = db;
        this.coll = coll;
        this.stream = stream;
        this.broadcast = new EventEmitter();
        this.broadcast.setMaxListeners(Number.POSITIVE_INFINITY);
        // TODO resume
        this.stream.on('change', notif => {
            if (notif.operationType === 'update')
                this.broadcast.emit(notif.fullDocument._id.toHexString(), notif.fullDocument);
        });
    }
    async *inquire(id) {
        const docs = await (0, events2stream_1.events2Stream)(this.broadcast, id);
        try {
            const initial = await this.coll.findOne({
                _id: mongodb_1.ObjectId.createFromHexString(id),
            });
            assert(initial !== null);
            yield initial;
            for await (const doc of docs)
                if (doc.state > initial.state)
                    yield doc;
        }
        finally {
            await docs.return();
        }
    }
}
exports.Get = Get;
//# sourceMappingURL=get.js.map