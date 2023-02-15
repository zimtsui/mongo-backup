import assert = require("assert");
import { Collection, Db, MongoClient } from "mongodb";
import Document from "../../../document";
import { Req, Res } from "../interfaces";


class Failure {
	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document>,
	) { }

	public async fail(doc: Document.Adopted<Req>, stderr: string) {
		let modifiedCount: number;

		const session = this.host.startSession();
		try {
			session.startTransaction();

			const res: Res.Fail = {
				jsonrpc: '2.0',
				id: doc.request.id,
				error: stderr,
			};
			({ modifiedCount } = await this.coll.updateOne({
				_id: doc._id,
				state: Document.State.ADOPTED,
			}, {
				$set: {
					state: Document.State.FAILED,
					'detail.failTime': Date.now(),
					'detail.response': res,
				}
			}, { session }));

			await session.commitTransaction();
		} catch (error) {
			await session.abortTransaction();
			throw error;
		} finally {
			await session.endSession();
		}

		assert(modifiedCount === 1, new AdoptedTaskNotFound());
	}
}

namespace Failure {
	export class AdoptedTaskNotFound extends Error { }
}

import AdoptedTaskNotFound = Failure.AdoptedTaskNotFound;

export default Failure;
