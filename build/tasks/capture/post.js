"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = exports.Conflict = exports.AlreadyExists = void 0;
const mongodb_1 = require("mongodb");
const assert = require("assert");
// interface Query extends Readonly<Record<string, string>> {
// 	readonly db: string;
// 	readonly bucket: string;
// 	readonly object: string;
// }
class BucketObjectAlreadyExists extends Error {
}
class AlreadyExists extends Error {
    constructor(id) {
        super();
        this.id = id;
    }
}
exports.AlreadyExists = AlreadyExists;
class Conflict extends Error {
    constructor(id) {
        super();
        this.id = id;
    }
}
exports.Conflict = Conflict;
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
        let oldDoc;
        try {
            try {
                const newDoc = {
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
                assert(oldDoc === null, new BucketObjectAlreadyExists());
            }
            catch (err) {
                await session.abortTransaction();
                throw err;
            }
            finally {
                await session.endSession();
            }
            const result = await this.coll.findOne({
                _id,
                'request.params.db': db,
            });
            assert(result !== null);
            return id;
        }
        catch (err) {
            if (err instanceof BucketObjectAlreadyExists) {
                if (oldDoc.request.params.db === db)
                    throw new AlreadyExists(id);
                else
                    throw new Conflict(id);
            }
            throw err;
        }
    }
}
exports.Post = Post;
//# sourceMappingURL=post.js.map