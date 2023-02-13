import { Collection, Db, MongoClient } from 'mongodb';
import Document from '../../document';
import { Req } from './interfaces';
declare class Submission {
    private host;
    private db;
    private coll;
    constructor(host: MongoClient, db: Db, coll: Collection<Document>);
    private insert;
    submit(db: string, bucket: string, object: string): Promise<Document.Orphan<Req>>;
}
declare namespace Submission {
    class AlreadyExists extends Error {
        doc: Document.Orphan<Req> | Document.Adopted<Req>;
        constructor(doc: Document.Orphan<Req> | Document.Adopted<Req>);
    }
    class Conflict extends Error {
        doc: Document.Orphan<Req> | Document.Adopted<Req>;
        constructor(doc: Document.Orphan<Req> | Document.Adopted<Req>);
    }
}
export default Submission;
