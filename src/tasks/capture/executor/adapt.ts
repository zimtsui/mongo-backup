import { execFile } from "child_process";
import { Req } from "../interfaces";
import { promisify } from "util";
import { resolve } from "path";



export default async function adapt(req: Req) {
	await promisify(execFile)(
		resolve(__dirname, '../../../mongo-backup'),
		[
			'capture',
			req.params.bucket,
			req.params.object,
			req.params.db,
		],
	);
}
