import { Collection, Db, MongoClient, ObjectId, ChangeStream, ChangeStreamDocument } from 'mongodb';
import Document from '../document';
import EventEmitter = require('events');
import { TypedEventEmitter } from 'mongodb';
import { StateEventEmitter } from '../state-event-emitter';



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

	public inquire<Req, ResSucc, ResFail>(
		id: string,
	): StateEventEmitter<Document<Req, ResSucc, ResFail>> {
		return new StateEventEmitter<Document<Req, ResSucc, ResFail>>(
			this.coll.findOne({
				_id: ObjectId.createFromHexString(id),
			}) as Promise<Document<Req, ResSucc, ResFail>>,
			this.broadcast,
			id,
			(doc0, doc) => doc0.state <= doc.state,
		);
	}
}

export default Inquiry;
