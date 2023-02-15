import Koa = require('koa');
import Router = require('@koa/router');
import { Capture, Restore, Inquiry, Cancellation } from './tasks';
import { MongoClient } from 'mongodb';
import Document from './document';
import assert = require('assert');
import { KoaWsFilter } from '@zimtsui/koa-ws-filter';
import { once } from 'events';

assert(process.env.TASKLIST_HOST);
assert(process.env.TASKLIST_DB);
assert(process.env.TASKLIST_COLL);
assert(process.env.PORT);

const host = new MongoClient(`mongodb://${process.env.TASKLIST_HOST}`);
const db = host.db(process.env.TASKLIST_DB);
const coll = db.collection<Document>(process.env.TASKLIST_COLL);
const stream = coll.watch([], { fullDocument: 'updateLookup' })

const captureSubmission = new Capture.Submission(host, db, coll);
const restoreSubmission = new Restore.Submission(host, db, coll);
const inquiry = new Inquiry(host, db, coll, stream);
const cancellation = new Cancellation(host, db, coll);

const router = new Router();
const filter = new KoaWsFilter();

filter.ws(async (ctx, next) => {
	assert(typeof ctx.query.id === 'string');

	try {
		const stream = inquiry.inquire(ctx.query.id);
		stream.on('error', () => void stream.close());

		const [doc0] = <[Document]>await once(stream, 'state');
		const ws = await ctx.upgrade();
		ws.on('close', () => stream.close());
		ws.send(JSON.stringify(doc0));

		stream.on('state', doc => void ws.send(JSON.stringify(doc)));
		await next();
	} catch (err) {
		if (err instanceof Inquiry.NotFound)
			ctx.status = 404;
		else
			throw err;
	}
});

router.get('/', filter.protocols());

router.post('/capture', async (ctx, next) => {
	assert(typeof ctx.query.db === 'string');
	assert(typeof ctx.query.bucket === 'string');
	assert(typeof ctx.query.object === 'string');
	try {
		const doc = await captureSubmission.submit(
			ctx.query.db,
			ctx.query.bucket,
			ctx.query.object,
		);
		ctx.status = 201;
		ctx.body = doc;
	} catch (err) {
		if (err instanceof Capture.Submission.AlreadyExists) {
			ctx.status = 208;
			ctx.body = err.doc;
		} else if (err instanceof Capture.Submission.Conflict) {
			ctx.status = 409;
			ctx.body = err.doc;
		} else throw err;
	}
	await next();
});

router.post('/restore', async (ctx, next) => {
	assert(typeof ctx.query.bucket === 'string');
	assert(typeof ctx.query.object === 'string');
	assert(typeof ctx.query.db === 'string');
	try {
		const doc = await restoreSubmission.submit(
			ctx.query.db,
			ctx.query.bucket,
			ctx.query.object,
		);
		ctx.status = 201;
		ctx.body = doc;
	} catch (err) {
		if (err instanceof Restore.Submission.AlreadyExists) {
			ctx.status = 208;
			ctx.body = err.doc;
		} else if (err instanceof Restore.Submission.Conflict) {
			ctx.status = 409;
			ctx.body = err.doc;
		} else throw err;
	}
	await next();
});

router.delete('/', async (ctx, next) => {
	assert(typeof ctx.query.id === 'string');
	try {
		const doc = await cancellation.cancel(ctx.query.id);
		ctx.status = 200;
		ctx.body = doc;
	} catch (err) {
		if (err instanceof Cancellation.AlreadyExits) {
			ctx.status = 208;
			ctx.body = err.doc;
		} else if (err instanceof Cancellation.NotFound) {
			ctx.status = 404;
		}
	}
});

const app = new Koa();
app.use(router.routes());

app.listen(Number.parseInt(process.env.PORT));
