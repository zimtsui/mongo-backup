export interface Obj {
	readonly jsonrpc: '2.0';
}

export interface Req<Id, Method> extends Obj {
	readonly id: Id;
	readonly method: Method;
}

export namespace Res {
	export interface Succ<Id, Result> extends Obj {
		readonly id: Id;
		readonly result: Result;
	}

	export interface Fail<Id, Error> extends Obj {
		readonly id: Id;
		readonly error: Error;
	}
}
