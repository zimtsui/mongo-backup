"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
class Cancellation {
    constructor(host, db, coll) {
        this.host = host;
        this.db = db;
        this.coll = coll;
    }
    async cancel(id) {
        const _id = mongodb_1.ObjectId.createFromHexString(id);
        let after;
        const session = this.host.startSession();
        try {
            session.startTransaction();
            ({ value: after } = await this.coll.findOneAndUpdate({
                _id,
                state: {
                    $in: [
                        0 /* Document.State.ORPHAN */,
                        1 /* Document.State.ADOPTED */,
                    ],
                },
            }, {
                $set: {
                    state: 2 /* Document.State.CANCELLED */,
                },
            }, {
                session,
                returnDocument: 'after',
            }));
            await session.commitTransaction();
        }
        catch (err) {
            await session.abortTransaction();
            throw err;
        }
        finally {
            await session.endSession();
        }
        if (after !== null)
            return after;
        const doc = await this.coll.findOne({
            _id,
        });
        if (doc === null)
            throw new NotFound();
        if ([
            2 /* Document.State.CANCELLED */,
            3 /* Document.State.SUCCEEDED */,
            4 /* Document.State.FAILED */,
        ].includes(doc.state))
            throw new AlreadyExits(doc);
        throw new Error();
    }
}
(function (Cancellation) {
    class AlreadyExits extends Error {
        constructor(doc) {
            super();
            this.doc = doc;
        }
    }
    Cancellation.AlreadyExits = AlreadyExits;
    class NotFound extends Error {
    }
    Cancellation.NotFound = NotFound;
})(Cancellation || (Cancellation = {}));
var AlreadyExits = Cancellation.AlreadyExits;
var NotFound = Cancellation.NotFound;
exports.default = Cancellation;
//# sourceMappingURL=cancellation.js.map