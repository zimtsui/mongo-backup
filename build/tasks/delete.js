"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllDelete = void 0;
const mongodb_1 = require("mongodb");
class AllDelete {
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
            after = await this.coll.findOneAndUpdate({
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
            });
            session.commitTransaction();
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
            throw new NotExist();
        if ([
            2 /* Document.State.CANCELLED */,
            3 /* Document.State.SUCCEEDED */,
            4 /* Document.State.FAILED */,
        ].includes(doc.state))
            throw new AlreadyExits(doc);
        throw new Error();
    }
}
exports.AllDelete = AllDelete;
(function (AllDelete) {
    class AlreadyExits extends Error {
        constructor(doc) {
            super();
            this.doc = doc;
        }
    }
    AllDelete.AlreadyExits = AlreadyExits;
    class NotExist extends Error {
    }
    AllDelete.NotExist = NotExist;
})(AllDelete = exports.AllDelete || (exports.AllDelete = {}));
var AlreadyExits = AllDelete.AlreadyExits;
var NotExist = AllDelete.NotExist;
//# sourceMappingURL=delete.js.map