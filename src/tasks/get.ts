import { Collection, Db, MongoClient, ObjectId, ChangeStream, ChangeStreamUpdateDocument } from 'mongodb';
import assert = require('assert');
import Document from '../document';
import * as Http from '../http';
import EventEmitter = require('events');
import { events2Stream } from '../events2stream';
import { TypedEventEmitter } from 'mongodb';

interface Query extends Readonly<Record<string, string>> {
	readonly id: string;
}

export class Get {
	private broadcast = <
		TypedEventEmitter<
			Record<
				string,
				(doc: Document<unknown, unknown, unknown>) => void
			>
		>>new EventEmitter();

	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document<unknown, unknown, unknown>>,
		private stream: ChangeStream<Document<unknown, unknown, unknown>, ChangeStreamUpdateDocument<Document<unknown, unknown, unknown>>>,
	) {
		this.broadcast.setMaxListeners(Number.POSITIVE_INFINITY);
		const changeStream = this.coll.watch([], { fullDocument: 'updateLookup' });
		// TODO resume
		this.stream.on('change', notif => {
			if (notif.operationType === 'update')
				this.broadcast.emit(
					notif.fullDocument!._id.toHexString(),
					notif.fullDocument!,
				);
		});
	}

	public handle<Req, ResSucc, ResFail>(req: Http.Req<unknown>): AsyncGenerator<Document<Req, ResSucc, ResFail>, void> {
		this.validate(req.query);
		return this.inquire(req.query);
	}

	private validate(query: Readonly<Record<string, string>>): asserts query is Query {
		assert(query.id);
	}

	private async* inquire<Req, ResSucc, ResFail>(
		query: Query,
	): AsyncGenerator<Document<Req, ResSucc, ResFail>, void> {
		const docs = await events2Stream<Document<Req, ResSucc, ResFail>>(
			this.broadcast,
			query.id,
		);
		try {
			const initial = <Document<Req, ResSucc, ResFail>>await this.coll.findOne({
				_id: ObjectId.createFromHexString(query.id),
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
