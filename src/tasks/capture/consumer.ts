import assert = require("assert");
import { Collection, MongoClient } from "mongodb";
import * as Document from "../../document";
import { exec, execFile } from "child_process";
import { CaptureErr, CaptureReq, CaptureRes } from "./interfaces";
import { promisify } from "util";
import { Semaphore } from "@zimtsui/coroutine-locks";
import { JsonRpcObj, JsonRpcReq } from "../../json-rpc";

assert(process.env.TASKLIST_HOST);
assert(process.env.TASKLIST_DB);
assert(process.env.TASKLIST_COLL);
assert(process.env.HOSTNAME);
assert(process.env.PORT);
assert(process.env.PARALLEL);

assert(process.env.USERDB_HOST);

const host = new MongoClient(process.env.TASKLIST_HOST);
const db = host.db(process.env.TASKLIST_DB);
const coll = db.collection<Document.AllState<CaptureReq, CaptureRes, CaptureErr>>(process.env.TASKLIST_COLL);

const sem = new Semaphore(Number.parseInt(process.env.PARALLEL));

const stream = coll.watch();

async function loop() {
	for await (const x of stream) {
		const request = await adopt();
		await sem.p();
		execute(request);
	}
};

async function execute(request: CaptureReq) {
	try {
		await promisify(execFile)(
			'mongo-backup',
			[
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
	} catch (err) {
		fail(request);
	} finally {
		sem.v();
	}
}

async function fail(request: CaptureReq) {
	const session = host.startSession();
	try {
		session.startTransaction();

		await coll.updateOne({
			'request.id': request.id,
			state: 'ADOPTED',
		}, {
			$set: {
				state: 'FAILED',
				'detail.failTime': Date.now(),
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

async function adopt(): Promise<CaptureReq> {
	const session = host.startSession();
	try {
		session.startTransaction();

		const { request } = <Document.Orphan<CaptureReq>><unknown>await coll.findOneAndUpdate({
			request: { method: 'capture' },
			state: 'ORPHAN',
		}, {
			$set: {
				state: 'ADOPTED',
				'detail.responder': `${process.env.HOSTNAME}:${process.env.PORT}`,
				'detail.adoptTime': Date.now(),
			}
		}, { session });
		return request;

		session.commitTransaction();
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}

}
