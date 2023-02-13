import { Collection, Db, MongoClient, MongoError, ObjectId } from 'mongodb';
import assert = require('assert');
import Document from '../../document';
import { Req } from './interfaces';


class BucketObjectAlreadyExists extends Error {
	public constructor(
		public doc: Document.Orphan<Req> | Document.Adopted<Req>,
	) { super(); }
}

class Post {
	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document>,
	) { }

	public async submit(
		db: string,
		bucket: string,
		object: string,
	): Promise<Document.Orphan<Req>> {
		const _id = new ObjectId();
		const id = _id.toHexString();

		const session = this.host.startSession();
		session.startTransaction();

		try {
			let newDoc: Document.Orphan<Req>;
			let oldDoc: Document.Orphan<Req> | null;
			try {
				newDoc = {
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

				oldDoc = await this.coll.findOneAndUpdate({
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
				}) as unknown as Document.Orphan<Req> | null;

				session.commitTransaction();
			} catch (err) {
				await session.abortTransaction();
				throw err;
			} finally {
				await session.endSession();
			}

			assert(oldDoc === null, new BucketObjectAlreadyExists(oldDoc!));
			return newDoc;
		} catch (err) {
			if (err instanceof BucketObjectAlreadyExists) {
				if (err.doc.request.params.db === db)
					throw new AlreadyExists(err.doc);
				else
					throw new Conflict(err.doc);
			}
			throw err;
		}
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
