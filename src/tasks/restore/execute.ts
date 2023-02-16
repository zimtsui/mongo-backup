import { execFile } from "child_process";
import { promisify } from "util";
import { resolve } from "path";
import { Params, Result } from "./interfaces";
import assert = require("assert");


assert(process.env.BACKUP_MONGO_HOST_URI);
assert(process.env.BACKUP_S3_HOST_ALIAS);

export async function execute(
	params: Params,
): Promise<Result> {
	return await promisify(execFile)(
		resolve(__dirname, '../../../mongo-backup'),
		[
			'restore',
			params.db,
			params.bucket,
			params.object,
		],
	).then(
		() => null,
		err => Promise.reject(new Error(err.stderr)),
	);
}
