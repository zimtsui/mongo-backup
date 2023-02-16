import * as AsyncRpc from "../../async-rpc/interfaces";
export type Method = 'capture';
export interface Params {
    readonly db: string;
    readonly bucket: string;
    readonly object: string;
}
export type Result = null;
export type ErrDesc = string;
export declare namespace Document {
    type Orphan = AsyncRpc.Document.Orphan<Method, Params>;
    type Adopted = AsyncRpc.Document.Adopted<Method, Params>;
    type Cancelled = AsyncRpc.Document.Cancelled<Method, Params>;
    type Succeeded = AsyncRpc.Document.Succeeded<Method, Params, Result>;
    type Failed = AsyncRpc.Document.Failed<Method, Params, ErrDesc>;
}
export type Document = AsyncRpc.Document<Method, Params, Result, ErrDesc>;
