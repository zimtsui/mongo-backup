import * as JsonRpc from '../../json-rpc';

export interface Req extends JsonRpc.Req<string, 'capture'> {
	readonly params: {
		readonly db: string;
		readonly bucket: string;
		readonly object: string;
	};
};

export type ResSucc = JsonRpc.Res.Succ<string, null>;
export type ResFail = JsonRpc.Res.Fail<string, string>;
