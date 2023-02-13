import * as JsonRpc from '../../json-rpc';
export interface Req extends JsonRpc.Req<string, 'capture'> {
    readonly params: {
        readonly db: string;
        readonly bucket: string;
        readonly object: string;
    };
}
export declare namespace Res {
    type Succ = JsonRpc.Res.Succ<string, null>;
    type Fail = JsonRpc.Res.Fail<string, string>;
}
