import Koa = require('koa');
import Router = require('@koa/router');
import * as Capture from './tasks/capture/post';
import { MongoClient } from 'mongodb';
import Document from './document';
import assert = require('assert');
import { Get } from './tasks/get';

assert(process.env.TASKLIST_HOST);
assert(process.env.TASKLIST_DB_NAME);
assert(process.env.TASKLIST_COLL_NAME);

const host = new MongoClient(process.env.TASKLIST_HOST);
const db = host.db(process.env.TASKLIST_DB_NAME);
const coll = db.collection<Document>(process.env.TASKLIST_COLL_NAME);
const stream = coll.watch([], { fullDocument: 'updateLookup' })

const capturePost = new Capture.Post(host, db, coll);
const get = new Get(host, db, coll, stream);


const router = new Router();

router.post('/capture', async (ctx, next) => {
	assert(typeof ctx.query.db === 'string');
	assert(typeof ctx.query.bucket === 'string');
	assert(typeof ctx.query.object === 'string');
	try {
		const id = await capturePost.submit(
			ctx.query.db,
			ctx.query.bucket,
			ctx.query.object,
		);
		ctx.status = 201;
		ctx.set('Laf-Task-Id', id);
	} catch (err) {
		if (err instanceof Capture.AlreadyExists) {
			ctx.status = 208;
			ctx.set('Laf-Task-Id', err.id);
		} else if (err instanceof Capture.Conflict) {
			ctx.status = 409;
			ctx.set('Laf-Task-Id', err.id);
		} else throw err;
	}
});

const app = new Koa();
app.use(router.routes());
