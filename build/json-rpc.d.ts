export interface Obj {
    readonly jsonrpc: '2.0';
}
export interface Req<Id, Method> extends Obj {
    readonly id: Id;
    readonly method: Method;
}
export declare namespace Res {
    interface Succ<Id, Result> extends Obj {
        readonly id: Id;
        readonly result: Result;
    }
    interface Fail<Id, Error> extends Obj {
        readonly id: Id;
        readonly error: Error;
    }
}
