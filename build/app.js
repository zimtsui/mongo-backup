"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Koa = require("koa");
const Router = require("@koa/router");
const tasks_1 = require("./tasks");
const mongodb_1 = require("mongodb");
const assert = require("assert");
const koa_ws_filter_1 = require("@zimtsui/koa-ws-filter");
assert(process.env.TASKLIST_HOST);
assert(process.env.TASKLIST_DB);
assert(process.env.TASKLIST_COLL);
assert(process.env.PORT);
const host = new mongodb_1.MongoClient(`mongodb://${process.env.TASKLIST_HOST}`);
const db = host.db(process.env.TASKLIST_DB);
const coll = db.collection(process.env.TASKLIST_COLL);
const stream = coll.watch([], { fullDocument: 'updateLookup' });
const captureSubmission = new tasks_1.Capture.Submission(host, db, coll);
const restoreSubmission = new tasks_1.Restore.Submission(host, db, coll);
const allGet = new tasks_1.Inquiry(host, db, coll, stream);
const allDelete = new tasks_1.Cancellation(host, db, coll);
const router = new Router();
const filter = new koa_ws_filter_1.KoaWsFilter();
filter.ws(async (ctx, next) => {
    const ws = await ctx.upgrade();
    assert(typeof ctx.query.id === 'string');
    const see = allGet.inquire(ctx.query.id);
    see.on('state', doc => void ws.send(JSON.stringify(doc)));
    ws.on('close', () => see.close());
    await next();
});
router.get('/', filter.protocols());
router.post('/capture', async (ctx, next) => {
    assert(typeof ctx.query.db === 'string');
    assert(typeof ctx.query.bucket === 'string');
    assert(typeof ctx.query.object === 'string');
    try {
        const doc = await captureSubmission.submit(ctx.query.db, ctx.query.bucket, ctx.query.object);
        ctx.status = 201;
        ctx.body = doc;
    }
    catch (err) {
        if (err instanceof tasks_1.Capture.Submission.AlreadyExists) {
            ctx.status = 208;
            ctx.body = err.doc;
        }
        else if (err instanceof tasks_1.Capture.Submission.Conflict) {
            ctx.status = 409;
            ctx.body = err.doc;
        }
        else
            throw err;
    }
    await next();
});
router.post('/restore', async (ctx, next) => {
    assert(typeof ctx.query.bucket === 'string');
    assert(typeof ctx.query.object === 'string');
    assert(typeof ctx.query.db === 'string');
    try {
        const doc = await restoreSubmission.submit(ctx.query.db, ctx.query.bucket, ctx.query.object);
        ctx.status = 201;
        ctx.body = doc;
    }
    catch (err) {
        if (err instanceof tasks_1.Restore.Submission.AlreadyExists) {
            ctx.status = 208;
            ctx.body = err.doc;
        }
        else if (err instanceof tasks_1.Restore.Submission.Conflict) {
            ctx.status = 409;
            ctx.body = err.doc;
        }
        else
            throw err;
    }
    await next();
});
router.delete('/', async (ctx, next) => {
    assert(typeof ctx.query.id === 'string');
    try {
        const doc = await allDelete.cancel(ctx.query.id);
        ctx.status = 200;
        ctx.body = doc;
    }
    catch (err) {
        if (err instanceof tasks_1.Cancellation.AlreadyExits) {
            ctx.status = 208;
            ctx.body = err.doc;
        }
        else if (err instanceof tasks_1.Cancellation.NotExist) {
            ctx.status = 404;
        }
    }
});
const app = new Koa();
app.use(router.routes());
app.listen(Number.parseInt(process.env.PORT));
//# sourceMappingURL=app.js.map