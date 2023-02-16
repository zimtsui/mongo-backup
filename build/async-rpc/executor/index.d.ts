import { ChangeStream, ChangeStreamDocument } from "mongodb";
import { Document } from "../interfaces";
import { Adoption } from "./adoption";
import { Failure } from "./failure";
import { Success } from "./success";
interface Execute<params, result> {
    (params: params): Promise<result>;
}
export declare class Executor<method extends string, params, result, errDesc> {
    constructor(stream: ChangeStream<Document, ChangeStreamDocument<Document>>, adoption: Adoption, success: Success, failure: Failure, method: method, execute: Execute<params, result>);
}
export {};
