import EventEmitter = require("events");
import EventBuffer from "./event-buffer";

/*
	在第一个状态到来之前关闭，会导致未定义的结果。
 */

class StateStream<State> extends EventEmitter {
	private eb: EventBuffer;
	private ebError: EventBuffer;

	public constructor(
		private currentPromise: Promise<State>,
		ee: EventEmitter,
		event: string | symbol,
		private before: (state0: State, state: State) => boolean,
	) {
		super();
		this.eb = new EventBuffer(ee, event);
		this.ebError = new EventBuffer(ee, 'error');
		this.open();
	}

	private async open() {
		let current: State;
		try {
			current = await this.currentPromise;
		} catch (error) {
			this.emit('error', error);
			return;
		}
		this.emit('state', current);
		this.eb.flush();
		this.ebError.flush();
		let started = false;
		this.eb.on('event', state => {
			if (started ||= this.before(current, state))
				this.emit('state', state);
		});
		this.ebError.on('event', error => void this.emit('error', error));
	}

	public close() {
		this.eb.close();
		this.ebError.close();
	}
}

interface Events<State> {
	state(state: State): void;
	error(error: unknown): void;
}

interface StateStream<State> extends EventEmitter {
	on<Event extends keyof Events<State>>(event: Event, listener: Events<State>[Event]): this;
	once<Event extends keyof Events<State>>(event: Event, listener: Events<State>[Event]): this;
	off<Event extends keyof Events<State>>(event: Event, listener: Events<State>[Event]): this;
	emit<Event extends keyof Events<State>>(event: Event, ...params: Parameters<Events<State>[Event]>): boolean;
}

export default StateStream;
