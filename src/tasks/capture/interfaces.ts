import * as JsonRpc from '../../json-rpc';

export interface Req extends JsonRpc.Req<string, 'capture'> {
	readonly params: {
		readonly db: string;
		readonly bucket: string;
		readonly object: string;
	};
};

export namespace Res {
	export type Succ = JsonRpc.Res.Succ<string, null>;
	export type Fail = JsonRpc.Res.Fail<string, string>;
}
