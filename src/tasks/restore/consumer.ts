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
			const doc = await adopt();
			execute(doc);
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


async function execute(doc: Document.Adopted<Req>) {
	try {
		await promisify(execFile)(
			resolve(__dirname, '../../../mongo-backup'),
			[
				'restore',
				doc.request.params.db,
				doc.request.params.bucket,
				doc.request.params.object,
			],
			{
				env: {
					...process.env,
					MONGO_HOST: process.env.USERDB_HOST,
				},
			},
		);
		succeed(doc);
	} catch (err: any) {
		fail(doc, <string>err.stderr);
	}
}

async function succeed(doc: Document.Adopted<Req>) {
	const session = host.startSession();
	try {
		session.startTransaction();

		const res: Res.Succ = {
			jsonrpc: '2.0',
			id: doc.request.id,
			result: null,
		};
		await coll.updateOne({
			_id: doc._id,
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


async function fail(doc: Document.Adopted<Req>, stderr: string) {
	const session = host.startSession();
	try {
		session.startTransaction();

		const res: Res.Fail = {
			jsonrpc: '2.0',
			id: doc.request.id,
			error: stderr,
		};
		await coll.updateOne({
			_id: doc._id,
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

async function adopt(): Promise<Document.Adopted<Req>> {
	let newDoc: Document.Adopted<Req> | null;

	const session = host.startSession();
	try {
		session.startTransaction();
		newDoc = <Document.Adopted<Req> | null><unknown>await coll.findOneAndUpdate({
			request: { method: 'restore' },
			state: Document.State.ORPHAN,
		}, {
			$set: {
				state: Document.State.ADOPTED,
				'detail.responder': `${process.env.HOSTNAME}:${process.env.PORT}`,
				'detail.adoptTime': Date.now(),
			}
		}, {
			session,
			returnDocument: 'after',
		});
		session.commitTransaction();
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}

	assert(newDoc !== null, new NoOrphan());
	return newDoc;
}
