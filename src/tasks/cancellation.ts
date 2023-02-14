import { Collection, Db, ModifyResult, MongoClient, MongoError, ObjectId } from 'mongodb';
import Document from '../document';


class Cancellation {
	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document>,
	) { }

	public async cancel(
		id: string,
	): Promise<Document> {
		const _id = ObjectId.createFromHexString(id);

		let after: Document | null;
		const session = this.host.startSession();
		try {
			session.startTransaction();
			({ value: after } = await this.coll.findOneAndUpdate({
				_id,
				state: {
					$in: [
						Document.State.ORPHAN,
						Document.State.ADOPTED,
					],
				},
			}, {
				$set: {
					state: Document.State.CANCELLED,
				},
			}, {
				session,
				returnDocument: 'after',
			}) as ModifyResult<Document>);

			await session.commitTransaction();
		} catch (err) {
			await session.abortTransaction();
			throw err;
		} finally {
			await session.endSession();
		}

		if (after !== null) return after;
		const doc = await this.coll.findOne({
			_id,
		});
		if (doc === null) throw new NotExist();
		if ([
			Document.State.CANCELLED,
			Document.State.SUCCEEDED,
			Document.State.FAILED,
		].includes(doc.state))
			throw new AlreadyExits(doc as Document.Cancelled<unknown> | Document.Succeeded<unknown, unknown> | Document.Failed<unknown, unknown>);
		throw new Error();
	}
}


namespace Cancellation {
	export class AlreadyExits extends Error {
		public constructor(
			public doc: Document.Cancelled<unknown> | Document.Succeeded<unknown, unknown> | Document.Failed<unknown, unknown>,
		) { super(); }
	}
	export class NotExist extends Error { }
}

import AlreadyExits = Cancellation.AlreadyExits;
import NotExist = Cancellation.NotExist;

export default Cancellation;
