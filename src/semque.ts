import { Semaphore } from "@zimtsui/coroutine-locks";

export class Semque<T> {
	private sem = new Semaphore();
	private queue: T[] = [];

	public push(x: T) {
		this.queue.push(x);
		this.sem.v();
	}

	public async pop(): Promise<T> {
		await this.sem.p();
		return this.queue.pop()!;
	}
}
