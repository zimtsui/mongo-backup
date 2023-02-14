"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const mongodb_1 = require("mongodb");
const child_process_1 = require("child_process");
const util_1 = require("util");
const path_1 = require("path");
assert(process.env.TASKLIST_HOST);
assert(process.env.TASKLIST_DB);
assert(process.env.TASKLIST_COLL);
assert(process.env.USERDB_HOST);
const host = new mongodb_1.MongoClient(process.env.TASKLIST_HOST);
const db = host.db(process.env.TASKLIST_DB);
const coll = db.collection(process.env.TASKLIST_COLL);
const stream = coll.watch();
stream.on('change', async (notif) => {
    try {
        if (notif.operationType === 'insert' &&
            notif.fullDocument.request.method === 'restore') {
            const doc = await adopt();
            execute(doc);
        }
    }
    catch (err) {
        if (err instanceof NoOrphan)
            return;
        console.error(err);
    }
});
(async () => {
    try {
        for (;;) {
            const request = await adopt();
            execute(request).catch(console.error);
        }
    }
    catch (err) {
        if (err instanceof NoOrphan)
            return;
        console.error(err);
    }
})();
async function execute(doc) {
    try {
        await (0, util_1.promisify)(child_process_1.execFile)((0, path_1.resolve)(__dirname, '../../../mongo-backup'), [
            'restore',
            doc.request.params.db,
            doc.request.params.bucket,
            doc.request.params.object,
        ], {
            env: {
                ...process.env,
                MONGO_HOST: process.env.USERDB_HOST,
            },
        });
        succeed(doc);
    }
    catch (err) {
        fail(doc, err.stderr);
    }
}
async function succeed(doc) {
    const session = host.startSession();
    try {
        session.startTransaction();
        const res = {
            jsonrpc: '2.0',
            id: doc.request.id,
            result: null,
        };
        await coll.updateOne({
            _id: doc._id,
            state: 1 /* Document.State.ADOPTED */,
        }, {
            $set: {
                state: 3 /* Document.State.SUCCEEDED */,
                'detail.succeedTime': Date.now(),
                'detail.response': res,
            }
        }, { session });
        session.commitTransaction();
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
}
async function fail(doc, stderr) {
    const session = host.startSession();
    try {
        session.startTransaction();
        const res = {
            jsonrpc: '2.0',
            id: doc.request.id,
            error: stderr,
        };
        await coll.updateOne({
            _id: doc._id,
            state: 1 /* Document.State.ADOPTED */,
        }, {
            $set: {
                state: 4 /* Document.State.FAILED */,
                'detail.failTime': Date.now(),
                'detail.response': res,
            }
        }, { session });
        session.commitTransaction();
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
}
class NoOrphan extends Error {
}
async function adopt() {
    let newDoc;
    const session = host.startSession();
    try {
        session.startTransaction();
        ({ value: newDoc } = await coll.findOneAndUpdate({
            request: { method: 'restore' },
            state: 0 /* Document.State.ORPHAN */,
        }, {
            $set: {
                state: 1 /* Document.State.ADOPTED */,
                'detail.responder': `${process.env.HOSTNAME}:${process.env.PORT}`,
                'detail.adoptTime': Date.now(),
            }
        }, {
            session,
            returnDocument: 'after',
        }));
        session.commitTransaction();
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        await session.endSession();
    }
    assert(newDoc !== null, new NoOrphan());
    return newDoc;
}
//# sourceMappingURL=consumer.js.map