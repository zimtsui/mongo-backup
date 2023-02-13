"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
class Post {
    constructor(host, db, coll) {
        this.host = host;
        this.db = db;
        this.coll = coll;
    }
    async submit(db, bucket, object) {
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
                    method: 'capture',
                    params: {
                        db,
                        bucket,
                        object,
                    },
                },
                state: 0 /* Document.State.ORPHAN */,
                detail: { submitTime: Date.now() },
            };
            oldDoc = await this.coll.findOneAndUpdate({
                'request.method': 'capture',
                'request.params.bucket': bucket,
                'request.params.object': object,
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
        if (oldDoc === null)
            return newDoc;
        if (oldDoc.request.params.db === db)
            throw new AlreadyExists(oldDoc);
        else
            throw new Conflict(oldDoc);
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