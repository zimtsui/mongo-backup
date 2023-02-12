import { Collection, Db, MongoClient, MongoError, ObjectId } from 'mongodb';
import assert = require('assert');
import Document from '../../document';
import { Req, ResSucc, ResFail } from './interfaces';

// interface Query extends Readonly<Record<string, string>> {
// 	readonly db: string;
// 	readonly bucket: string;
// 	readonly object: string;
// }

class BucketObjectAlreadyExists extends Error { }
export class AlreadyExists extends Error {
	public constructor(
		public id: string,
	) { super(); }
}
export class Conflict extends Error {
	public constructor(
		public id: string,
	) { super(); }
}

export class Post {
	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document>,
	) { }

	public async submit(
		db: string,
		bucket: string,
		object: string,
	): Promise<string> {
		const _id = new ObjectId();
		const id = _id.toHexString();

		const session = this.host.startSession();
		session.startTransaction();
		let oldDoc: Document.Orphan<Req> | null;

		try {
			try {
				const newDoc: Document.Orphan<Req> = {
					_id,
					request: {
						jsonrpc: '2.0',
						id,
						method: 'capture',
						params: {
							db,
							bucket,
							object,
						},
					},
					state: Document.State.ORPHAN,
					detail: { submitTime: Date.now() },
				};

				oldDoc = <Document.Orphan<Req> | null><unknown>await this.coll.findOneAndUpdate({
					'request.method': 'capture',
					'request.params.bucket': bucket,
					'request.params.object': object,
					state: {
						$in: [
							Document.State.ORPHAN,
							Document.State.ADOPTED,
						],
					},
				}, {
					$setOnInsert: newDoc,
				}, {
					upsert: true,
					session,
				});

				session.commitTransaction();
				assert(oldDoc === null, new BucketObjectAlreadyExists());
			} catch (err) {
				await session.abortTransaction();
				throw err;
			} finally {
				await session.endSession();
			}

			const result = await this.coll.findOne({
				_id,
				'request.params.db': db,
			});
			assert(result !== null);
			return id;
		} catch (err) {
			if (err instanceof BucketObjectAlreadyExists) {
				if (oldDoc!.request.params.db === db)
					throw new AlreadyExists(id);
				else
					throw new Conflict(id);

			}
			throw err;
		}
	}
}
