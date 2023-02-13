import { Collection, Db, MongoClient, ChangeStream, ChangeStreamDocument } from 'mongodb';
import Document from '../document';
import { StateEventEmitter } from '../state-event-emitter';
export declare class AllGet {
    private host;
    private db;
    private coll;
    private stream;
    private broadcast;
    constructor(host: MongoClient, db: Db, coll: Collection<Document>, stream: ChangeStream<Document, ChangeStreamDocument<Document>>);
    inquire<Req, ResSucc, ResFail>(id: string): StateEventEmitter<Document<Req, ResSucc, ResFail>>;
}
