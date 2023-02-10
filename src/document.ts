import { ObjectId } from "mongodb";

export interface Base<Request> {
	readonly _id: ObjectId;
	readonly request: Request;
}

export interface Orphan<Request> extends Base<Request> {
	readonly state: 'ORPHAN';
	readonly detail: Orphan.Detail;
}
export namespace Orphan {
	export interface Detail {
		readonly submitTime: number;
	}
}

export interface Adopted<Request> extends Base<Request> {
	readonly state: 'ADOPTED';
	readonly detail: Adopted.Detail;
}
export namespace Adopted {
	export interface Detail extends Orphan.Detail {
		readonly responder: string;
	}
}

export interface Cancelled<Request> extends Base<Request> {
	readonly state: 'CANCELLED';
	readonly detail: Cancelled.Detail;
}
export namespace Cancelled {
	export interface Detail extends Adopted.Detail {
		readonly cancellTime: number;
	}
}

export interface Succeeded<Request, Response> extends Base<Request> {
	readonly state: 'SUCCEEDED';
	readonly detail: Succeeded.Detail<Response>;
}
export namespace Succeeded {
	export interface Detail<Response> extends Adopted.Detail {
		readonly response: Response;
		readonly succeedTime: number;
	}
}

export interface Failed<Request, Error> extends Base<Request> {
	readonly state: 'FAILED';
	readonly detail: Failed.Detail<Error>;
}
export namespace Failed {
	export interface Detail<Error> extends Adopted.Detail {
		readonly error: Error;
		readonly failTime: number;
	}
}

export type AllState<Request, Response, Error> =
	Orphan<Request> |
	Adopted<Request> |
	Cancelled<Request> |
	Succeeded<Request, Response> |
	Failed<Request, Error>;
