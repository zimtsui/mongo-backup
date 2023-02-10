import assert = require("assert");
import { MongoClient } from "mongodb";
import { Document, OrphanDocument } from "./document";
import { exec } from "child_process";

assert(process.env.MONGO_HOST);
assert(process.env.MONGO_DB_NAME);
assert(process.env.MONGO_COLL_NAME);
assert(process.env.HOSTNAME);
assert(process.env.PORT);

const mongoHost = new MongoClient(process.env.MONGO_HOST);
const mongoDatabase = mongoHost.db(process.env.MONGO_DB_NAME);
const mongoCollection = mongoDatabase.collection<Document>(process.env.MONGO_COLL_NAME);

async function consume() {
	const { } = await mongoCollection.findOneAndUpdate({
		state: 'SUBMITTED',
	}, {
		$set: {
			state: 'ADOPTED',
			executorHost: `${process.env.HOSTNAME}:${process.env.PORT}`,
		}
	});
	exec('mongo-backup');
}
