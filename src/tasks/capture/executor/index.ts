import assert = require("assert");
import { MongoClient } from "mongodb";
import Document from "../../../document";
import { Req, Res } from "../interfaces";

assert(process.env.TASKLIST_HOST_URI);
assert(process.env.TASKLIST_DB);
assert(process.env.TASKLIST_COLL);

assert(process.env.BACKUP_MONGO_HOST_URI);
assert(process.env.BACKUP_S3_HOST_ALIAS);

const host = new MongoClient(process.env.TASKLIST_HOST_URI);
const db = host.db(process.env.TASKLIST_DB);
const coll = db.collection<Document>(process.env.TASKLIST_COLL);


const stream = coll.watch();

stream.on('change', async notif => {
	try {
		if (
			notif.operationType === 'insert' &&
			notif.fullDocument.request.method === 'capture'
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
