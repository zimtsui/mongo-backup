import { Collection, Db, MongoClient } from 'mongodb';
import Document from '../document';
export declare class AllDelete {
    private host;
    private db;
    private coll;
    constructor(host: MongoClient, db: Db, coll: Collection<Document>);
    cancel(id: string): Promise<Document>;
}
export declare namespace AllDelete {
    class AlreadyExits extends Error {
        doc: Document.Cancelled<unknown> | Document.Succeeded<unknown, unknown> | Document.Failed<unknown, unknown>;
        constructor(doc: Document.Cancelled<unknown> | Document.Succeeded<unknown, unknown> | Document.Failed<unknown, unknown>);
    }
    class NotExist extends Error {
    }
}
