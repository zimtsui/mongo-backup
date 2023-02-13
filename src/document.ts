import { ObjectId } from "mongodb";

namespace Document {
	export const enum State {
		ORPHAN,
		ADOPTED,
		CANCELLED,
		SUCCEEDED,
		FAILED,
	}

	interface Base<Req> {
		readonly _id: ObjectId;
		readonly request: Req;
		readonly state: State;
	}

	export interface Orphan<Req> extends Base<Req> {
		readonly state: State.ORPHAN;
		readonly detail: Orphan.Detail;
	}
	export namespace Orphan {
		export interface Detail {
			readonly submitTime: number;
		}
	}

	export interface Adopted<Req> extends Base<Req> {
		readonly state: State.ADOPTED;
		readonly detail: Adopted.Detail;
	}
	export namespace Adopted {
		export interface Detail extends Orphan.Detail {
			readonly responder: string;
			readonly adoptTime: number;
		}
	}

	export interface Cancelled<Req> extends Base<Req> {
		readonly state: State.CANCELLED;
		readonly detail: Cancelled.Detail;
	}
	export namespace Cancelled {
		export interface Detail extends Adopted.Detail {
			readonly cancellTime: number;
		}
	}

	export interface Succeeded<Req, ResSucc> extends Base<Req> {
		readonly state: State.SUCCEEDED;
		readonly detail: Succeeded.Detail<ResSucc>;
	}
	export namespace Succeeded {
		export interface Detail<ResSucc> extends Adopted.Detail {
			readonly response: ResSucc;
			readonly succeedTime: number;
		}
	}

	export interface Failed<Req, ResFail> extends Base<Req> {
		readonly state: State.FAILED;
		readonly detail: Failed.Detail<ResFail>;
	}
	export namespace Failed {
		export interface Detail<ResFail> extends Adopted.Detail {
			readonly response: ResFail;
			readonly failTime: number;
		}
	}
}

type Document<Req = unknown, ResSucc = unknown, ResFail = unknown> =
	Document.Orphan<Req> |
	Document.Adopted<Req> |
	Document.Cancelled<Req> |
	Document.Succeeded<Req, ResSucc> |
	Document.Failed<Req, ResFail>;

export default Document;
