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
			if (
				notif.operationType === 'insert' &&
				notif.fullDocument.detail.request.method === method
			) {
				const doc = await adoption.adopt<method, params>(method);

				let result: result;
				try {
					result = await execute(doc.detail.request.params);
				} catch (err) {
					failure.fail(doc, <errDesc>err);
					return;
				}
				success.succeed(doc, result);
			}
		});

		(async () => {
			try {
				for (; ;) {
					const doc = await adoption.adopt<method, params>(method);
					(async () => {
						let result: result;
						try {
							result = await execute(doc.detail.request.params);
						} catch (err) {
							failure.fail(doc, <errDesc>err);
							return;
						}
						success.succeed(doc, result);
					})();
				}
			} catch (err) {
				if (err instanceof Adoption.OrphanNotFound) return;
				console.error(err);
			}
		})();

	}
}
