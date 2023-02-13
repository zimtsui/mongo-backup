"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllDelete = void 0;
const mongodb_1 = require("mongodb");
const assert = require("assert");
class AllDelete {
    constructor(host, db, coll) {
        this.host = host;
        this.db = db;
        this.coll = coll;
    }
    async cancel(id) {
        const _id = mongodb_1.ObjectId.createFromHexString(id);
        const session = this.host.startSession();
        session.startTransaction();
        try {
            let after;
            try {
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
            assert(after !== null, new NotMatched());
            return after;
        }
        catch (err) {
            if (err instanceof NotMatched) {
                const doc = await this.coll.findOne({
                    _id,
                });
                assert(doc !== null, new NotExist());
                assert([
                    2 /* Document.State.CANCELLED */,
                    3 /* Document.State.SUCCEEDED */,
                    4 /* Document.State.FAILED */,
                ].includes(doc.state), new AlreadyExits(doc));
            }
            throw err;
        }
    }
}
exports.AllDelete = AllDelete;
class NotMatched extends Error {
}
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