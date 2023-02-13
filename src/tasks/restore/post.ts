import { Collection, Db, MongoClient, MongoError, ObjectId } from 'mongodb';
import Document from '../../document';
import { Req } from './interfaces';


class Post {
	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document>,
	) { }

	public async submit(
		bucket: string,
		object: string,
		db: string,
	): Promise<Document.Orphan<Req>> {
		const _id = new ObjectId();
		const id = _id.toHexString();

		let newDoc: Document.Orphan<Req>;
		let oldDoc: Document.Orphan<Req> | null;

		const session = this.host.startSession();
		try {
			session.startTransaction();
			newDoc = {
				_id,
				request: {
					jsonrpc: '2.0',
					id,
					method: 'restore',
					params: {
						bucket,
						object,
						db,
					},
				},
				state: Document.State.ORPHAN,
				detail: { submitTime: Date.now() },
			};

			oldDoc = await this.coll.findOneAndUpdate({
				'request.method': 'restore',
				'request.params.db': db,
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
			}) as unknown as Document.Orphan<Req> | null;

			session.commitTransaction();
		} catch (err) {
			await session.abortTransaction();
			throw err;
		} finally {
			await session.endSession();
		}

		if (oldDoc === null) return newDoc;
		if (oldDoc.request.params.db === db)
			throw new AlreadyExists(oldDoc);
		else
			throw new Conflict(oldDoc);
	}
}

namespace Post {
	export class AlreadyExists extends Error {
		public constructor(
			public doc: Document.Orphan<Req> | Document.Adopted<Req>,
		) { super(); }
	}
	export class Conflict extends Error {
		public constructor(
			public doc: Document.Orphan<Req> | Document.Adopted<Req>,
		) { super(); }
	}
}

import AlreadyExists = Post.AlreadyExists;
import Conflict = Post.Conflict;

export default Post;
