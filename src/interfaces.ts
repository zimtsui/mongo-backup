export interface JsonRpcObj {
	readonly jsonrpc: '2.0';
}

export interface JsonRpcReq<Id, Method> extends JsonRpcObj {
	readonly method: Method;
	readonly id: Id;
}

export interface JsonRpcResSucc<Id, Result> extends JsonRpcObj {
	readonly id: Id;
	readonly result: Result;
}

export interface JsonRpcResFail<Id, Error> extends JsonRpcObj {
	readonly id: Id;
	readonly error: Error;
}
