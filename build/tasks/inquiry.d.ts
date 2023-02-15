import { Collection, Db, MongoClient, ChangeStream, ChangeStreamDocument } from 'mongodb';
import Document from '../document';
import StateStream from '../state-stream';
declare class Inquiry {
    private host;
    private db;
    private coll;
    private stream;
    private broadcast;
    constructor(host: MongoClient, db: Db, coll: Collection<Document>, stream: ChangeStream<Document, ChangeStreamDocument<Document>>);
    private find;
    inquire<Req, ResSucc, ResFail>(id: string): StateStream<Document<Req, ResSucc, ResFail>>;
}
declare namespace Inquiry {
    class NotFound extends Error {
    }
}
export default Inquiry;
