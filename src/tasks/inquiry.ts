import { Collection, Db, MongoClient, ObjectId, ChangeStream, ChangeStreamDocument } from 'mongodb';
import Document from '../document';
import EventEmitter = require('events');
import { TypedEventEmitter } from 'mongodb';
import StateStream from '../state-stream';
import assert = require('assert');



class Inquiry {
	private broadcast = new EventEmitter() as TypedEventEmitter<Record<string, (doc: Document) => void>>;

	public constructor(
		private host: MongoClient,
		private db: Db,
		private coll: Collection<Document>,
		private stream: ChangeStream<Document, ChangeStreamDocument<Document>>,
	) {
		this.broadcast.setMaxListeners(Number.POSITIVE_INFINITY);
		this.stream.on('error', err => {
			console.error(err);
			process.exit(1);
		});
		this.stream.on('change', notif => {
			if (notif.operationType === 'update')
				this.broadcast.emit(
					notif.fullDocument!._id.toHexString(),
					notif.fullDocument!,
				);
		});
	}

	private async find<Req, ResSucc, ResFail>(
		id: string,
	): Promise<Document<Req, ResSucc, ResFail>> {
		const doc = await this.coll.findOne({
			_id: ObjectId.createFromHexString(id),
		}) as Document<Req, ResSucc, ResFail> | null;
		assert(doc !== null, new NotFound());
		return doc;
	}

	public inquire<Req, ResSucc, ResFail>(
		id: string,
	): StateStream<Document<Req, ResSucc, ResFail>> {
		return new StateStream(
			this.find<Req, ResSucc, ResFail>(id),
			this.broadcast,
			id,
			(doc0, doc) => doc0.state < doc.state,
		);
	}
}

namespace Inquiry {
	export class NotFound extends Error { }
}

import NotFound = Inquiry.NotFound;

export default Inquiry;
