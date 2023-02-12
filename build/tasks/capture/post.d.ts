import { Collection, Db, MongoClient } from 'mongodb';
import Document from '../../document';
export declare class AlreadyExists extends Error {
    id: string;
    constructor(id: string);
}
export declare class Conflict extends Error {
    id: string;
    constructor(id: string);
}
export declare class Post {
    private host;
    private db;
    private coll;
    constructor(host: MongoClient, db: Db, coll: Collection<Document>);
    submit(db: string, bucket: string, object: string): Promise<string>;
}
