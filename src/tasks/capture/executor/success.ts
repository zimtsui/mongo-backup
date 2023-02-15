import assert = require("assert");
import { Collection, Db, MongoClient } from "mongodb";
import Document from "../../../document";
import { Req, Res } from "../interfaces";


class Success {
	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document>,
	) { }

	public async succeed(doc: Document.Adopted<Req>) {
		let modifiedCount: number;

		const session = this.host.startSession();
		try {
			session.startTransaction();

			const res: Res.Succ = {
				jsonrpc: '2.0',
				id: doc.request.id,
				result: null,
			};
			({ modifiedCount } = await this.coll.updateOne({
				_id: doc._id,
				state: Document.State.ADOPTED,
			}, {
				$set: {
					state: Document.State.SUCCEEDED,
					'detail.succeedTime': Date.now(),
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

namespace Success {
	export class AdoptedTaskNotFound extends Error { }
}

import AdoptedTaskNotFound = Success.AdoptedTaskNotFound;

export default Success;
