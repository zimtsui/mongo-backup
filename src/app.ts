import Koa = require('koa');
import Router = require('@koa/router');
import * as Capture from './tasks/capture/post';
import { MongoClient } from 'mongodb';
import Document from './document';
import assert = require('assert');
import { AllGet } from './tasks/get';
import { AllDelete } from './tasks/delete';
import { KoaWsFilter } from '@zimtsui/koa-ws-filter';

assert(process.env.TASKLIST_HOST);
assert(process.env.TASKLIST_DB_NAME);
assert(process.env.TASKLIST_COLL_NAME);
assert(process.env.PORT);

const host = new MongoClient(process.env.TASKLIST_HOST);
const db = host.db(process.env.TASKLIST_DB_NAME);
const coll = db.collection<Document>(process.env.TASKLIST_COLL_NAME);
const stream = coll.watch([], { fullDocument: 'updateLookup' })

const capturePost = new Capture.Post(host, db, coll);
const allGet = new AllGet(host, db, coll, stream);
const allDelete = new AllDelete(host, db, coll);

const router = new Router();
const filter = new KoaWsFilter();

filter.ws(async (ctx, next) => {
	const ws = await ctx.upgrade();
	assert(typeof ctx.query.id === 'string');
	const see = allGet.inquire(ctx.query.id);
	see.on('document', (doc: Document) => void ws.send(JSON.stringify(doc)));
	ws.on('close', () => see.close());
	await next();
});

router.get('/capture', filter.protocols());

router.post('/capture', async (ctx, next) => {
	assert(typeof ctx.query.db === 'string');
	assert(typeof ctx.query.bucket === 'string');
	assert(typeof ctx.query.object === 'string');
	try {
		const doc = await capturePost.submit(
			ctx.query.db,
			ctx.query.bucket,
			ctx.query.object,
		);
		ctx.status = 201;
		ctx.body = doc;
	} catch (err) {
		if (err instanceof Capture.Post.AlreadyExists) {
			ctx.status = 208;
			ctx.body = err.doc;
		} else if (err instanceof Capture.Post.Conflict) {
			ctx.status = 409;
			ctx.body = err.doc;
		} else throw err;
	}
	await next();
});

router.delete('/capture', async (ctx, next) => {
	assert(typeof ctx.query.id === 'string');
	try {
		const doc = await allDelete.cancel(ctx.query.id);
		ctx.status = 200;
		ctx.body = doc;
	} catch (err) {
		if (err instanceof AllDelete.AlreadyExits) {
			ctx.status = 208;
			ctx.body = err.doc;
		} else if (err instanceof AllDelete.NotExist) {
			ctx.status = 404;
		}
	}
});

const app = new Koa();
app.use(router.routes());

app.listen(Number.parseInt(process.env.PORT));
