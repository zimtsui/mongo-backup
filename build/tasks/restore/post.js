"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const assert = require("assert");
class BucketObjectAlreadyExists extends Error {
    constructor(doc) {
        super();
        this.doc = doc;
    }
}
class Post {
    constructor(host, db, coll) {
        this.host = host;
        this.db = db;
        this.coll = coll;
    }
    async submit(bucket, object, db) {
        const _id = new mongodb_1.ObjectId();
        const id = _id.toHexString();
        const session = this.host.startSession();
        session.startTransaction();
        try {
            let newDoc;
            let oldDoc;
            try {
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
                session.commitTransaction();
            }
            catch (err) {
                await session.abortTransaction();
                throw err;
            }
            finally {
                await session.endSession();
            }
            assert(oldDoc === null, new BucketObjectAlreadyExists(oldDoc));
            return newDoc;
        }
        catch (err) {
            if (err instanceof BucketObjectAlreadyExists) {
                if (err.doc.request.params.db === db)
                    throw new AlreadyExists(err.doc);
                else
                    throw new Conflict(err.doc);
            }
            throw err;
        }
    }
}
(function (Post) {
    class AlreadyExists extends Error {
        constructor(doc) {
            super();
            this.doc = doc;
        }
    }
    Post.AlreadyExists = AlreadyExists;
    class Conflict extends Error {
        constructor(doc) {
            super();
            this.doc = doc;
        }
    }
    Post.Conflict = Conflict;
})(Post || (Post = {}));
var AlreadyExists = Post.AlreadyExists;
var Conflict = Post.Conflict;
exports.default = Post;
//# sourceMappingURL=post.js.map