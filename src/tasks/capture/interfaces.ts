// import * as JsonRpc from '../../json-rpc';
import GenericDocument from '../../document';


export namespace Req {
	export interface Params {
		readonly db: string;
		readonly bucket: string;
		readonly object: string;
	}
}
export type Req = GenericDocument.Req<'capture', Req.Params>;

export namespace Res {
	export type Succ = GenericDocument.Res.Succ<null>;
	export type Fail = GenericDocument.Res.Fail<string>;
}

export type Document = GenericDocument<Req, Res.Succ, Res.Fail>;
