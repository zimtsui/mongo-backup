import EventEmitter = require("events");
import EventBuffer from "./event-buffer";


class StateStream<State> extends EventEmitter {
	private eventBuffer: EventBuffer;
	private errorBuffer: EventBuffer;

	public constructor(
		private currentPromise: Promise<State>,
		ee: EventEmitter,
		event: string | symbol,
		private before: (state0: State, state: State) => boolean,
	) {
		super();
		this.eventBuffer = new EventBuffer(ee, event);
		this.errorBuffer = new EventBuffer(ee, 'error');
		this.open();
	}

	private async open() {
		let current: State;
		try {
			current = await this.currentPromise;
			this.emit('state', current);
		} catch (error) {
			this.emit('error', error);
			return;
		}
		this.eventBuffer.flush();
		this.errorBuffer.flush();
		let started = false;
		this.eventBuffer.on('event', state => {
			if (started ||= this.before(current, state))
				this.emit('state', state);
		});
		this.errorBuffer.on('event', error => void this.emit('error', error));
	}

	/**
	 * 在第一个状态到来之前关闭，会导致未定义的结果。
	 */
	public close() {
		this.eventBuffer.close();
		this.errorBuffer.close();
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
