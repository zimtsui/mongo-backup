import { ObjectId } from "mongodb";
declare namespace Document {
    const enum State {
        ORPHAN = 0,
        ADOPTED = 1,
        CANCELLED = 2,
        SUCCEEDED = 3,
        FAILED = 4
    }
    interface Base<Req> {
        readonly _id: ObjectId;
        readonly request: Req;
        readonly state: State;
    }
    interface Orphan<Req> extends Base<Req> {
        readonly state: State.ORPHAN;
        readonly detail: Orphan.Detail;
    }
    namespace Orphan {
        interface Detail {
            readonly submitTime: number;
        }
    }
    interface Adopted<Req> extends Base<Req> {
        readonly state: State.ADOPTED;
        readonly detail: Adopted.Detail;
    }
    namespace Adopted {
        interface Detail extends Orphan.Detail {
            readonly responder: string;
            readonly adoptTime: number;
        }
    }
    interface Cancelled<Req> extends Base<Req> {
        readonly state: State.CANCELLED;
        readonly detail: Cancelled.Detail;
    }
    namespace Cancelled {
        interface Detail extends Adopted.Detail {
            readonly cancellTime: number;
        }
    }
    interface Succeeded<Req, ResSucc> extends Base<Req> {
        readonly state: State.SUCCEEDED;
        readonly detail: Succeeded.Detail<ResSucc>;
    }
    namespace Succeeded {
        interface Detail<ResSucc> extends Adopted.Detail {
            readonly response: ResSucc;
            readonly succeedTime: number;
        }
    }
    interface Failed<Req, ResFail> extends Base<Req> {
        readonly state: State.FAILED;
        readonly detail: Failed.Detail<ResFail>;
    }
    namespace Failed {
        interface Detail<ResFail> extends Adopted.Detail {
            readonly response: ResFail;
            readonly failTime: number;
        }
    }
}
type Document<Req = unknown, ResSucc = unknown, ResFail = unknown> = Document.Orphan<Req> | Document.Adopted<Req> | Document.Cancelled<Req> | Document.Succeeded<Req, ResSucc> | Document.Failed<Req, ResFail>;
export default Document;
