import Koa = require('koa');
import Router = require('@koa/router');
import * as Capture from '../tasks/capture';
import { MongoClient } from 'mongodb';
import * as Document from '../document';
import assert = require('assert');

assert(process.env.TASKLIST_HOST);
assert(process.env.TASKLIST_DB_NAME);
assert(process.env.TASKLIST_COLL_NAME);

const host = new MongoClient(process.env.TASKLIST_HOST);
const db = host.db(process.env.TASKLIST_DB_NAME);
const coll = db.collection<Document.All>(process.env.TASKLIST_COLL_NAME);

interface InitialCtxState
	extends Capture.InitialCtxState { }

const router = new Router<InitialCtxState>();
router.use(async (ctx, next) => {
	ctx.state.host = host;
	ctx.state.db = db;
	ctx.state.coll = coll;
});

router.use('/capture', Capture.router.routes());

const app = new Koa();
app.use(router.routes());
