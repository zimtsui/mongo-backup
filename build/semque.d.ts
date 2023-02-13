import * as CoroutineLocks from "@zimtsui/coroutine-locks";
declare class Semque<T> {
    private sem;
    private queue;
    push(x: T): void;
    pop(): Promise<T>;
    throw(err: Error): void;
    tryPop(): NonNullable<T>;
}
declare namespace Semque {
    export import TryLockError = CoroutineLocks.TryLockError;
}
export default Semque;
