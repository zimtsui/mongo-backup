import { Collection, Db, MongoClient } from 'mongodb';
import Document from '../document';
declare class Cancellation {
    private host;
    private db;
    private coll;
    constructor(host: MongoClient, db: Db, coll: Collection<Document>);
    cancel(id: string): Promise<Document>;
}
declare namespace Cancellation {
    class AlreadyExits extends Error {
        doc: Document.Cancelled<unknown> | Document.Succeeded<unknown, unknown> | Document.Failed<unknown, unknown>;
        constructor(doc: Document.Cancelled<unknown> | Document.Succeeded<unknown, unknown> | Document.Failed<unknown, unknown>);
    }
    class NotFound extends Error {
    }
}
export default Cancellation;
