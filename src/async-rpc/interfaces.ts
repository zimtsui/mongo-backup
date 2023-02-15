import { ObjectId } from "mongodb";
import * as JsonRpc from '../json-rpc';


export type Req<
	method extends string = string,
	params = unknown,
> = JsonRpc.Req<string, method, params>;
export namespace Res {
	export type Succ<
		result = unknown,
	> = JsonRpc.Res.Succ<string, result>;
	export type Fail<
		errDesc = unknown,
	> = JsonRpc.Res.Fail<string, errDesc>;
}


export namespace Document {
	export const enum State {
		ORPHAN,
		ADOPTED,
		CANCELLED,
		SUCCEEDED,
		FAILED,
	}

	interface Base<
		method extends string = string,
		params = unknown,
	> {
		readonly _id: ObjectId;
		readonly state: State;
		readonly detail: Base.Detail<method, params>;
	}
	namespace Base {
		export interface Detail<
			method extends string,
			params,
		> {
			readonly request: Req<method, params>;
			readonly lock: string;
		}
	}

	export interface Orphan<
		method extends string = string,
		params = unknown,
	> extends Base<method, params> {
		readonly state: State.ORPHAN;
		readonly detail: Orphan.Detail<method, params>;
	}
	export namespace Orphan {
		export interface Detail<
			method extends string,
			params,
		> extends Base.Detail<method, params> {
			readonly submitTime: number;
		}
	}

	export interface Adopted<
		method extends string = string,
		params = unknown,
	> extends Base<method, params> {
		readonly state: State.ADOPTED;
		readonly detail: Adopted.Detail<method, params>;
	}
	export namespace Adopted {
		export interface Detail<
			method extends string,
			params,
		> extends Orphan.Detail<method, params> {
			readonly adoptTime: number;
		}
	}

	export interface Cancelled<
		method extends string = string,
		params = unknown,
	> extends Base<method, params> {
		readonly state: State.CANCELLED;
		readonly detail: Cancelled.Detail<method, params>;
	}
	export namespace Cancelled {
		export interface Detail<
			method extends string,
			params,
		> extends Adopted.Detail<method, params> {
			readonly cancelTime: number;
		}
	}

	export interface Succeeded<
		method extends string = string,
		params = unknown,
		result = unknown,
	> extends Base<method, params> {
		readonly state: State.SUCCEEDED;
		readonly detail: Succeeded.Detail<method, params, result>;
	}
	export namespace Succeeded {
		export interface Detail<
			method extends string,
			params,
			result,
		> extends Adopted.Detail<method, params> {
			readonly response: Res.Succ<result>;
			readonly succeedTime: number;
		}
	}

	export interface Failed<
		method extends string = string,
		params = unknown,
		errDesc = unknown,
	> extends Base<method, params> {
		readonly state: State.FAILED;
		readonly detail: Failed.Detail<method, params, errDesc>;
	}
	export namespace Failed {
		export interface Detail<
			method extends string,
			params,
			errDesc,
		> extends Adopted.Detail<method, params> {
			readonly response: Res.Fail<errDesc>;
			readonly failTime: number;
		}
	}
}

export type Document<
	method extends string = string,
	params = unknown,
	result = unknown,
	errDesc = unknown,
> =
	Document.Orphan<method, params> |
	Document.Adopted<method, params> |
	Document.Cancelled<method, params> |
	Document.Succeeded<method, params, result> |
	Document.Failed<method, params, errDesc>;
