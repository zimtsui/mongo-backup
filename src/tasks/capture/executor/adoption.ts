import assert = require("assert");
import { Collection, Db, ModifyResult, MongoClient } from "mongodb";
import Document from "../../../document";
import { Req } from "../interfaces";


class Adoption {
	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document>,
	) { }

	public async adopt(): Promise<Document.Adopted<Req>> {
		let newDoc: Document.Adopted<Req> | null;

		const session = this.host.startSession();
		try {
			session.startTransaction();
			({ value: newDoc } = await this.coll.findOneAndUpdate({
				request: { method: 'capture' },
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
			}) as ModifyResult<Document.Adopted<Req>>);
			await session.commitTransaction();
		} catch (error) {
			await session.abortTransaction();
			throw error;
		} finally {
			await session.endSession();
		}

		assert(newDoc !== null, new NoOrphan());
		return newDoc;
	}
}

namespace Adoption {
	export class NoOrphan extends Error { }
}

import NoOrphan = Adoption.NoOrphan;

export default Adoption;
