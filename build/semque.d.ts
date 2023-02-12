export declare class Semque<T> {
    private sem;
    private queue;
    push(x: T): void;
    pop(): Promise<T>;
}
