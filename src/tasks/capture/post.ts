import { Collection, Db, MongoClient, MongoError, ObjectId } from 'mongodb';
import Koa = require('koa');
import assert = require('assert');
import { __ASSERT } from '../../meta';
import * as Document from '../../document';
import Router = require('@koa/router');
import { CaptureErr, CaptureReq, CaptureRes } from './interfaces';

export interface InitialCtxState {
	readonly host: MongoClient;
	readonly db: Db;
	readonly coll: Collection<Document.AllState<CaptureReq, CaptureRes, CaptureErr>>;
}

interface Query {
	readonly db: string;
	readonly bucket: string;
	readonly object: string;
}

namespace validate {
	export type CtxState = InitialCtxState;
}
async function validate(
	ctx: Koa.ParameterizedContext<validate.CtxState>,
	next: Koa.Next,
) {
	assert(ctx.query.db);
	assert(ctx.query.bucket);
	assert(ctx.query.object);
	await next();
}

namespace submit {
	export type CtxState = validate.CtxState;
}
async function submit(
	ctx: Koa.ParameterizedContext<submit.CtxState>,
	next: Koa.Next,
) {
	__ASSERT<Query>(ctx.query);

	const _id = new ObjectId();
	const id = _id.toHexString();
	const session = ctx.state.host.startSession();
	try {
		session.startTransaction();

		await ctx.state.coll.updateOne({
			request: {
				method: 'capture',
				params: {
					bucket: ctx.query.bucket,
					object: ctx.query.object,
				},
			},
			state: { $in: ['ORPHAN', 'ADOPTED'] },
		}, {
			$setOnInsert: {
				_id,
				request: {
					jsonrpc: '2.0',
					id,
					method: 'capture',
					params: {
						db: ctx.query.db,
						bucket: ctx.query.bucket,
						object: ctx.query.object,
					},
				},
			},
		}, {
			upsert: true,
			session,
		});
		session.commitTransaction();
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}

	const result = await ctx.state.coll.findOne({
		_id,
		request: { params: { db: ctx.query.db } },
	});
	assert(result !== null);
	ctx.set('Laf-Task-Id', id);
	ctx.status = 201;
	await next();
}

export const router = new Router<InitialCtxState>();
router.post<validate.CtxState>('/', validate);
router.post<submit.CtxState>('/', submit);
