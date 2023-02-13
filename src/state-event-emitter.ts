import EventEmitter = require("events");
import Semque from "./semque";


export class StateEventEmitter<Full, Delta = Full> extends EventEmitter {
	private q = new Semque<Delta>();

	public constructor(
		fullPromise: Promise<Full>,
		private ee: EventEmitter,
		private event: string | symbol,
		before: (full: Full, delta: Delta) => boolean,
	) {
		super();
		ee.on(event, this.listener);
		ee.on('error', (...params) => this.emit('error', ...params));

		(async () => {
			const full = await fullPromise;
			let started = false;
			for (; ;) {
				const delta = await this.q.pop();
				if (started ||= before(full, delta))
					this.emit('state', delta);
			}
		})().catch(err => {
			if (err instanceof Closed) return;
			console.error(err);
		});
	}

	private listener = (state: Delta) => void this.q.push(state);

	public close(): void {
		this.ee.off(this.event, this.listener);
		this.q.throw(new Closed());
	}
}

class Closed extends Error { }

interface Events<State> {
	state(state: State): void;
	error(...params: any[]): void;
}

export interface StateEventEmitter<Full, Delta = Full> extends EventEmitter {
	on<Event extends keyof Events<Delta>>(event: Event, listener: Events<Delta>[Event]): this;
	once<Event extends keyof Events<Delta>>(event: Event, listener: Events<Delta>[Event]): this;
	off<Event extends keyof Events<Delta>>(event: Event, listener: Events<Delta>[Event]): this;
	emit<Event extends keyof Events<Delta>>(event: Event, ...params: Parameters<Events<Delta>[Event]>): boolean;
}
