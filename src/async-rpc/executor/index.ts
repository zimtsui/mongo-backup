import { ChangeStream, ChangeStreamDocument } from "mongodb";
import { Document, Req, Res } from "../interfaces";
import { Adoption } from "./adoption";
import { Failure } from "./failure";
import { Success } from "./success";


interface Execute<params, result> {
	(params: params): Promise<result>;
}

export class Executor<
	method extends string,
	params,
	result,
	errDesc,
> {
	public constructor(
		stream: ChangeStream<Document, ChangeStreamDocument<Document>>,
		adoption: Adoption,
		success: Success,
		failure: Failure,
		method: method,
		execute: Execute<params, result>,
	) {
		stream.on('change', async notif => {
			if (notif.operationType !== 'insert') return;
			if (notif.fullDocument.request.method !== method) return;

			const doc = await adoption.adopt<method, params>(method);
			await execute(doc.request.params).then(
				result => void success.succeed(doc, result),
				(err: errDesc) => void failure.fail(doc, err),
			);
		});

		(async () => {
			try {
				for (; ;) {
					const doc = await adoption.adopt<method, params>(method);
					execute(doc.request.params).then(
						result => void success.succeed(doc, result),
						(err: errDesc) => void failure.fail(doc, err),
					);
				}
			} catch (err) {
				if (err instanceof Adoption.OrphanNotFound) { }
				else throw err;
			}
		})();
	}
}
