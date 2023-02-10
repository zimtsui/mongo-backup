import {
	JsonRpcReq,
	JsonRpcResSucc,
	JsonRpcResFail,
} from "../../interfaces";

export interface RestoreReq extends JsonRpcReq<string, 'restore'> {
	readonly params: {
		readonly bucket: string;
		readonly object: string;
		readonly db: string;
	};
};

export type RestoreRes = JsonRpcResSucc<string, null> | JsonRpcResFail<string, Error>;
