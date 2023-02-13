import * as JsonRpc from '../../json-rpc';
export interface Req extends JsonRpc.Req<string, 'restore'> {
    readonly params: {
        readonly bucket: string;
        readonly object: string;
        readonly db: string;
    };
}
export declare namespace Res {
    type Succ = JsonRpc.Res.Succ<string, null>;
    type Fail = JsonRpc.Res.Fail<string, string>;
}
