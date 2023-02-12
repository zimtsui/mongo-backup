import { Readable } from "stream";

export interface Req<Body> {
	readonly headers: Readonly<Record<string, string>>;
	readonly query: Readonly<Record<string, string>>
	readonly body: Body;
}

export interface Res {
	status?: number;
	headers?: Readonly<Record<string, string>>;
	body?: string | {} | Buffer | Readable | null;
}
