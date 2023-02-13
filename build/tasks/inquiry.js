"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const EventEmitter = require("events");
const state_event_emitter_1 = require("../state-event-emitter");
class Inquiry {
    constructor(host, db, coll, stream) {
        this.host = host;
        this.db = db;
        this.coll = coll;
        this.stream = stream;
        this.broadcast = new EventEmitter();
        this.broadcast.setMaxListeners(Number.POSITIVE_INFINITY);
        this.stream.on('error', err => {
            console.error(err);
            process.exit(1);
        });
        this.stream.on('change', notif => {
            if (notif.operationType === 'update')
                this.broadcast.emit(notif.fullDocument._id.toHexString(), notif.fullDocument);
        });
    }
    inquire(id) {
        return new state_event_emitter_1.StateEventEmitter(this.coll.findOne({
            _id: mongodb_1.ObjectId.createFromHexString(id),
        }), this.broadcast, id, (doc0, doc) => doc0.state <= doc.state);
    }
}
exports.default = Inquiry;
//# sourceMappingURL=inquiry.js.map