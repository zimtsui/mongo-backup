import { Collection, Db, MongoClient } from 'mongodb';
import Document from '../../document';
import { Req } from './interfaces';
declare class Post {
    private host;
    private db;
    private coll;
    constructor(host: MongoClient, db: Db, coll: Collection<Document>);
    submit(bucket: string, object: string, db: string): Promise<Document.Orphan<Req>>;
}
declare namespace Post {
    class AlreadyExists extends Error {
        doc: Document.Orphan<Req> | Document.Adopted<Req>;
        constructor(doc: Document.Orphan<Req> | Document.Adopted<Req>);
    }
    class Conflict extends Error {
        doc: Document.Orphan<Req> | Document.Adopted<Req>;
        constructor(doc: Document.Orphan<Req> | Document.Adopted<Req>);
    }
}
export default Post;
