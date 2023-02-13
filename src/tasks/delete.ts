import { Collection, Db, MongoClient, MongoError, ObjectId } from 'mongodb';
import assert = require('assert');
import Document from '../document';


export class AllDelete {
	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document>,
	) { }

	public async cancel(
		id: string,
	): Promise<Document> {
		const _id = ObjectId.createFromHexString(id);

		const session = this.host.startSession();
		session.startTransaction();

		try {
			let after: Document;
			try {
				after = await this.coll.findOneAndUpdate({
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
				}) as unknown as Document;

				session.commitTransaction();
				assert(after !== null, new NotMatched());
			} catch (err) {
				await session.abortTransaction();
				throw err;
			} finally {
				await session.endSession();
			}
			return after;
		} catch (err) {
			if (err instanceof NotMatched) {
				const doc = await this.coll.findOne({
					_id,
				});
				assert(doc !== null, new NotExist());
				assert(
					[
						Document.State.CANCELLED,
						Document.State.SUCCEEDED,
						Document.State.FAILED,
					].includes(doc.state),
					new AlreadyExits(doc as Document.Cancelled<unknown> | Document.Succeeded<unknown, unknown> | Document.Failed<unknown, unknown>),
				);
			}
			throw err;
		}
	}
}


class NotMatched extends Error { }

export namespace AllDelete {
	export class AlreadyExits extends Error {
		public constructor(
			public doc: Document.Cancelled<unknown> | Document.Succeeded<unknown, unknown> | Document.Failed<unknown, unknown>,
		) { super(); }
	}
	export class NotExist extends Error { }
}

import AlreadyExits = AllDelete.AlreadyExits;
import NotExist = AllDelete.NotExist;
