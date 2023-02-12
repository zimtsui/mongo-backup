import { Collection, Db, MongoClient, MongoError, ObjectId } from 'mongodb';
// import Koa = require('koa');
import assert = require('assert');
// import { __ASSERT } from '../../meta';
import Document from '../../document';
// import Router = require('@koa/router');
import { Req, ResSucc, ResFail } from './interfaces';
import * as Http from '../../http';

interface Query extends Readonly<Record<string, string>> {
	readonly db: string;
	readonly bucket: string;
	readonly object: string;
}

export class Post {
	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document<Req, ResSucc, ResFail>>,
	) { }

	public async handle(req: Http.Req<unknown>): Promise<Http.Res> {
		this.validate(req.query);
		return await this.submit(req.query);
	}

	private validate(query: Readonly<Record<string, string>>): asserts query is Query {
		assert(query.db);
		assert(query.bucket);
		assert(query.object);
	}

	private async submit(query: Query): Promise<Http.Res> {
		const _id = new ObjectId();
		const id = _id.toHexString();
		const session = this.host.startSession();
		try {
			session.startTransaction();

			const doc: Document.Orphan<Req> = {
				_id,
				request: {
					jsonrpc: '2.0',
					id,
					method: 'capture',
					params: {
						db: query.db,
						bucket: query.bucket,
						object: query.object,
					},
				},
				state: Document.State.ORPHAN,
				detail: { submitTime: Date.now() },
			};

			await this.coll.updateOne({
				'request.method': 'capture',
				'request.params.bucket': query.bucket,
				'request.params.object': query.object,
				state: {
					$in: [
						Document.State.ORPHAN,
						Document.State.ADOPTED,
					],
				},
			}, {
				$setOnInsert: doc,
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

		const result = await this.coll.findOne({
			_id,
			'request.params.db': query.db,
		});
		assert(result !== null);
		return {
			status: 201,
			headers: {
				'Laf-Task-Id': id,
			},
		};
	}
}


// export interface InitialCtxState {
// 	host: MongoClient;
// 	db: Db;
// 	coll: Collection<Document<Req, Res, Err>>;
// }


// namespace validate {
// 	export type CtxState = InitialCtxState;
// }
// async function validate(
// 	ctx: Koa.ParameterizedContext<validate.CtxState>,
// 	next: Koa.Next,
// ) {
// 	assert(ctx.query.db);
// 	assert(ctx.query.bucket);
// 	assert(ctx.query.object);
// 	await next();
// }

// namespace submit {
// 	export type CtxState = validate.CtxState;
// }
// async function submit(
// 	ctx: Koa.ParameterizedContext<submit.CtxState>,
// 	next: Koa.Next,
// ) {
// 	__ASSERT<Query>(ctx.query);

// 	const _id = new ObjectId();
// 	const id = _id.toHexString();
// 	const session = ctx.state.host.startSession();
// 	try {
// 		session.startTransaction();

// 		const doc: Document.Orphan<Req> = {
// 			_id,
// 			request: {
// 				jsonrpc: '2.0',
// 				id,
// 				method: 'capture',
// 				params: {
// 					db: ctx.query.db,
// 					bucket: ctx.query.bucket,
// 					object: ctx.query.object,
// 				},
// 			},
// 			state: 'ORPHAN',
// 			detail: { submitTime: Date.now() },
// 		};

// 		await ctx.state.coll.updateOne({
// 			'request.method': 'capture',
// 			'request.params.bucket': ctx.query.bucket,
// 			'request.params.object': ctx.query.object,
// 			state: { $in: ['ORPHAN', 'ADOPTED'] },
// 		}, {
// 			$setOnInsert: doc,
// 		}, {
// 			upsert: true,
// 			session,
// 		});

// 		session.commitTransaction();
// 	} catch (error) {
// 		await session.abortTransaction();
// 		throw error;
// 	} finally {
// 		await session.endSession();
// 	}

// 	const result = await ctx.state.coll.findOne({
// 		_id,
// 		'request.params.db': ctx.query.db,
// 	});
// 	assert(result !== null);
// 	ctx.set('Laf-Task-Id', id);
// 	ctx.status = 201;
// 	await next();
// }

// export const router = new Router<InitialCtxState>();
// router.post<validate.CtxState>('/', validate);
// router.post<submit.CtxState>('/', submit);
