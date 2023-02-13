import assert = require('assert');
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import Document from '../../document';
import { Req } from './interfaces';



class Submission {
	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document>,
	) { }

	private async insert(
		db: string,
		bucket: string,
		object: string,
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

		assert(oldDoc === null, new DocumentAlreadyExists(oldDoc!));
		return newDoc;
	}

	public async submit(
		db: string,
		bucket: string,
		object: string,
	): Promise<Document.Orphan<Req>> {
		try {
			return await this.insert(db, bucket, object);
		} catch (err) {
			if (err instanceof DocumentAlreadyExists) {
				if (err.doc.request.params.db === db)
					throw new AlreadyExists(err.doc);
				else
					throw new Conflict(err.doc);
			} else throw err;
		}
	}
}

namespace Submission {
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

import AlreadyExists = Submission.AlreadyExists;
import Conflict = Submission.Conflict;

class DocumentAlreadyExists extends Error {
	public constructor(
		public doc: Document.Orphan<Req> | Document.Adopted<Req>,
	) { super(); }
}

export default Submission;
