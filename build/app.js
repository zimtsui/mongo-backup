"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Koa = require("koa");
const Router = require("@koa/router");
const Capture = require("./tasks/capture/post");
const mongodb_1 = require("mongodb");
const assert = require("assert");
const get_1 = require("./tasks/get");
const delete_1 = require("./tasks/delete");
const koa_ws_filter_1 = require("@zimtsui/koa-ws-filter");
assert(process.env.TASKLIST_HOST);
assert(process.env.TASKLIST_DB_NAME);
assert(process.env.TASKLIST_COLL_NAME);
const host = new mongodb_1.MongoClient(process.env.TASKLIST_HOST);
const db = host.db(process.env.TASKLIST_DB_NAME);
const coll = db.collection(process.env.TASKLIST_COLL_NAME);
const stream = coll.watch([], { fullDocument: 'updateLookup' });
const capturePost = new Capture.Post(host, db, coll);
const allGet = new get_1.AllGet(host, db, coll, stream);
const allDelete = new delete_1.AllDelete(host, db, coll);
const router = new Router();
const filter = new koa_ws_filter_1.KoaWsFilter();
filter.ws(async (ctx, next) => {
    const ws = await ctx.upgrade();
    assert(typeof ctx.query.id === 'string');
    const see = allGet.inquire(ctx.query.id);
    see.on('document', (doc) => void ws.send(JSON.stringify(doc)));
    ws.on('close', () => see.close());
    await next();
});
router.get('/capture', filter.protocols());
router.post('/capture', async (ctx, next) => {
    assert(typeof ctx.query.db === 'string');
    assert(typeof ctx.query.bucket === 'string');
    assert(typeof ctx.query.object === 'string');
    try {
        const doc = await capturePost.submit(ctx.query.db, ctx.query.bucket, ctx.query.object);
        ctx.status = 201;
        ctx.body = doc;
    }
    catch (err) {
        if (err instanceof Capture.Post.AlreadyExists) {
            ctx.status = 208;
            ctx.body = err.doc;
        }
        else if (err instanceof Capture.Post.Conflict) {
            ctx.status = 409;
            ctx.body = err.doc;
        }
        else
            throw err;
    }
    await next();
});
router.delete('/capture', async (ctx, next) => {
    assert(typeof ctx.query.id === 'string');
    try {
        const doc = await allDelete.cancel(ctx.query.id);
        ctx.status = 200;
        ctx.body = doc;
    }
    catch (err) {
        if (err instanceof delete_1.AllDelete.AlreadyExits) {
            ctx.status = 208;
            ctx.body = err.doc;
        }
        else if (err instanceof delete_1.AllDelete.NotExist) {
            ctx.status = 404;
        }
    }
});
const app = new Koa();
app.use(router.routes());
//# sourceMappingURL=app.js.map