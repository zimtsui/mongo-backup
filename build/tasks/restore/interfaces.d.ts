import * as JsonRpc from '../../json-rpc';
export interface Req extends JsonRpc.Req<string, 'restore'> {
    readonly params: {
        readonly bucket: string;
        readonly object: string;
        readonly db: string;
    };
}
export type ResSucc = JsonRpc.Res.Succ<string, null>;
export type ResFail = JsonRpc.Res.Fail<string, string>;
