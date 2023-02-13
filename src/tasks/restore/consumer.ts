import assert = require("assert");
import { MongoClient } from "mongodb";
import Document from "../../document";
import { execFile } from "child_process";
import { Req, Res } from "./interfaces";
import { promisify } from "util";
import { resolve } from "path";

assert(process.env.TASKLIST_HOST);
assert(process.env.TASKLIST_DB);
assert(process.env.TASKLIST_COLL);

assert(process.env.USERDB_HOST);

const host = new MongoClient(process.env.TASKLIST_HOST);
const db = host.db(process.env.TASKLIST_DB);
const coll = db.collection<Document<Req, Res.Succ, Res.Fail>>(process.env.TASKLIST_COLL);


const stream = coll.watch();

stream.on('change', async notif => {
	try {
		if (
			notif.operationType === 'insert' &&
			notif.fullDocument.request.method === 'restore'
		) {
			const request = await adopt();
			execute(request);
		}
	} catch (err) {
		if (err instanceof NoOrphan) return;
		console.error(err);
	}
});

(async () => {
	try {
		for (; ;) {
			const request = await adopt();
			execute(request).catch(console.error)
		}
	} catch (err) {
		if (err instanceof NoOrphan) return;
		console.error(err);
	}
})();


async function execute(request: Req) {
	try {
		await promisify(execFile)(
			resolve(__dirname, '../../../mongo-backup'),
			[
				'restore',
				request.params.db,
				request.params.bucket,
				request.params.object,
			],
			{
				env: {
					...process.env,
					MONGO_HOST: process.env.USERDB_HOST,
				},
			},
		);
		succeed(request);
	} catch (err: any) {
		fail(request, err.stderr);
	}
}

async function succeed(request: Req) {
	const session = host.startSession();
	session.startTransaction();

	try {
		const res: Res.Succ = {
			jsonrpc: '2.0',
			id: request.id,
			result: null,
		};
		await coll.updateOne({
			'request.id': request.id,
			state: Document.State.ADOPTED,
		}, {
			$set: {
				state: Document.State.SUCCEEDED,
				'detail.succeedTime': Date.now(),
				'detail.response': res,
			}
		}, { session });

		session.commitTransaction();
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}
}


async function fail(request: Req, stderr: string) {
	const session = host.startSession();
	session.startTransaction();

	try {
		const res: Res.Fail = {
			jsonrpc: '2.0',
			id: request.id,
			error: stderr,
		};
		await coll.updateOne({
			'request.id': request.id,
			state: Document.State.ADOPTED,
		}, {
			$set: {
				state: Document.State.FAILED,
				'detail.failTime': Date.now(),
				'detail.response': res,
			}
		}, { session });

		session.commitTransaction();
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}
}

class NoOrphan extends Error { }

async function adopt(): Promise<Req> {
	const session = host.startSession();
	session.startTransaction();

	try {
		const doc = <Document.Orphan<Req> | null><unknown>await coll.findOneAndUpdate({
			request: { method: 'restore' },
			state: Document.State.ORPHAN,
		}, {
			$set: {
				state: Document.State.ADOPTED,
				'detail.responder': `${process.env.HOSTNAME}:${process.env.PORT}`,
				'detail.adoptTime': Date.now(),
			}
		}, { session });
		assert(doc !== null, new NoOrphan());

		session.commitTransaction();
		return doc.request;
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}
}
