import EventEmitter = require("events");
import Semque from "./semque";


export class StateEventEmitter<Full, Delta = Full> extends EventEmitter {
	private q = new Semque<Delta>();

	public constructor(
		fullPromise: Promise<Full>,
		private ee: EventEmitter,
		private eventName: string | symbol,
		emitAs: string | symbol,
		after: (full: Full, delta: Delta) => boolean,
	) {
		super();
		ee.on(eventName, this.listener);
		ee.on('error', (...params) => this.emit('error', ...params));

		(async () => {
			const full = await fullPromise;
			let started = false;
			for (; ;) {
				const delta = await this.q.pop();
				started ||= after(full, delta);
				if (started) this.emit(emitAs, delta);
			}
		})().catch(err => {
			if (err instanceof Closed) return;
			console.error(err);
		});
	}

	private listener = (delta: Delta) => this.q.push(delta);

	public close(): void {
		this.ee.off(this.eventName, this.listener);
		this.q.throw(new Closed());
	}
}

class Closed extends Error { }
