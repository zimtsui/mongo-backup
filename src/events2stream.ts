import EventEmitter = require("events");
import { Semque } from "./semque";

export async function events2Stream<Payload>(
	ee: EventEmitter,
	eventName: string | symbol,
): Promise<AsyncGenerator<Payload, void>> {
	async function* makeStream() {
		const semque = new Semque<Payload>();
		const listener = (payload: Payload) => {
			semque.push(payload);
		}
		ee.on(eventName, listener);
		try {
			yield <any>null;
			for (; ;)
				yield await semque.pop();
		} finally {
			ee.off(eventName, listener);
		}
	}

	const stream = makeStream();
	await stream.next();
	return stream;
}
