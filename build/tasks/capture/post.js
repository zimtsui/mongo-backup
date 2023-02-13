"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
const mongodb_1 = require("mongodb");
const assert = require("assert");
// interface Query extends Readonly<Record<string, string>> {
// 	readonly db: string;
// 	readonly bucket: string;
// 	readonly object: string;
// }
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
    async submit(db, bucket, object) {
        const _id = new mongodb_1.ObjectId();
        const id = _id.toHexString();
        const session = this.host.startSession();
        session.startTransaction();
        try {
            let newDoc;
            try {
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
                const oldDoc = await this.coll.findOneAndUpdate({
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
                assert(oldDoc === null, new BucketObjectAlreadyExists(oldDoc));
            }
            catch (err) {
                await session.abortTransaction();
                throw err;
            }
            finally {
                await session.endSession();
            }
            assert(await this.coll.findOne({
                _id,
                'request.params.db': db,
            }) !== null);
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
exports.Post = Post;
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
})(Post = exports.Post || (exports.Post = {}));
var AlreadyExists = Post.AlreadyExists;
var Conflict = Post.Conflict;
//# sourceMappingURL=post.js.map