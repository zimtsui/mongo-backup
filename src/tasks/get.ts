import { Collection, Db, MongoClient, ObjectId, ChangeStream, ChangeStreamDocument } from 'mongodb';
import assert = require('assert');
import Document from '../document';
import EventEmitter = require('events');
import { events2Stream } from '../events2stream';
import { TypedEventEmitter } from 'mongodb';

// interface Query extends Readonly<Record<string, string>> {
// 	readonly id: string;
// }

export class Get {
	private broadcast = <
		TypedEventEmitter<
			Record<
				string,
				(doc: Document) => void
			>
		>>new EventEmitter();

	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document>,
		private stream: ChangeStream<Document, ChangeStreamDocument<Document>>,
	) {
		this.broadcast.setMaxListeners(Number.POSITIVE_INFINITY);
		// TODO resume
		this.stream.on('change', notif => {
			if (notif.operationType === 'update')
				this.broadcast.emit(
					notif.fullDocument!._id.toHexString(),
					notif.fullDocument!,
				);
		});
	}

	public async* inquire<Req, ResSucc, ResFail>(
		id: string,
	): AsyncGenerator<Document<Req, ResSucc, ResFail>, void> {
		const docs = await events2Stream<Document<Req, ResSucc, ResFail>>(
			this.broadcast,
			id,
		);
		try {
			const initial = <Document<Req, ResSucc, ResFail>>await this.coll.findOne({
				_id: ObjectId.createFromHexString(id),
			});
			assert(initial !== null);
			yield initial;
			for await (const doc of docs)
				if (doc.state > initial.state)
					yield doc;
		} finally {
			await docs.return();
		}
	}
}
