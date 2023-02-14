"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const mongodb_1 = require("mongodb");
class Submission {
    constructor(host, db, coll) {
        this.host = host;
        this.db = db;
        this.coll = coll;
    }
    async insert(bucket, object, db) {
        const _id = new mongodb_1.ObjectId();
        const id = _id.toHexString();
        let newDoc;
        let oldDoc;
        const session = this.host.startSession();
        try {
            session.startTransaction();
            newDoc = {
                _id,
                request: {
                    jsonrpc: '2.0',
                    id,
                    method: 'restore',
                    params: {
                        bucket,
                        object,
                        db,
                    },
                },
                state: 0 /* Document.State.ORPHAN */,
                detail: { submitTime: Date.now() },
            };
            oldDoc = await this.coll.findOneAndUpdate({
                'request.method': 'restore',
                'request.params.db': db,
                state: {
                    $in: [
                        0 /* Document.State.ORPHAN */,
                        1 /* Document.State.ADOPTED */,
                    ],
                },
            }, {
                $setOnInsert: newDoc,
            }, {
                upsert: true,
                session,
            });
            await session.commitTransaction();
        }
        catch (err) {
            await session.abortTransaction();
            throw err;
        }
        finally {
            await session.endSession();
        }
        assert(oldDoc === null, new DocumentAlreadyExists(oldDoc));
        return newDoc;
    }
    async submit(bucket, object, db) {
        try {
            return await this.insert(db, bucket, object);
        }
        catch (err) {
            if (err instanceof DocumentAlreadyExists) {
                if (err.doc.request.params.bucket === bucket && err.doc.request.params.object === object)
                    throw new AlreadyExists(err.doc);
                else
                    throw new Conflict(err.doc);
            }
            else
                throw err;
        }
    }
}
(function (Submission) {
    class AlreadyExists extends Error {
        constructor(doc) {
            super();
            this.doc = doc;
        }
    }
    Submission.AlreadyExists = AlreadyExists;
    class Conflict extends Error {
        constructor(doc) {
            super();
            this.doc = doc;
        }
    }
    Submission.Conflict = Conflict;
})(Submission || (Submission = {}));
var AlreadyExists = Submission.AlreadyExists;
var Conflict = Submission.Conflict;
class DocumentAlreadyExists extends Error {
    constructor(doc) {
        super();
        this.doc = doc;
    }
}
exports.default = Submission;
//# sourceMappingURL=submission.js.map