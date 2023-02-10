import {
	JsonRpcReq,
	JsonRpcResSucc,
	JsonRpcResFail,
} from '../../interfaces';

export interface CaptureReq extends JsonRpcReq<string, 'capture'> {
	readonly params: {
		readonly db: string;
		readonly bucket: string;
		readonly object: string;
	};
};

export type CaptureRes = JsonRpcResSucc<string, null> | JsonRpcResFail<string, Error>;

export type CaptureErr = string;
