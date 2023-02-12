import { Collection, Db, MongoClient, ChangeStream, ChangeStreamDocument } from 'mongodb';
import Document from '../document';
export declare class Get {
    private host;
    private db;
    private coll;
    private stream;
    private broadcast;
    constructor(host: MongoClient, db: Db, coll: Collection<Document>, stream: ChangeStream<Document, ChangeStreamDocument<Document>>);
    inquire<Req, ResSucc, ResFail>(id: string): AsyncGenerator<Document<Req, ResSucc, ResFail>, void>;
}
