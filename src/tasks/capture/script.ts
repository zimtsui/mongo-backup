import { Executor } from "../../async-rpc/executor";
import assert = require("assert");
import { ChangeStream, Collection, Db, MongoClient } from "mongodb";
import { Document } from "../../async-rpc/interfaces";
import { Adoption } from "../../async-rpc/executor/adoption";
import { Success } from "../../async-rpc/executor/success";
import { Failure } from "../../async-rpc/executor/failure";
import { execute } from "./execute";
import { Method, Params, Result, ErrDesc } from "./interfaces";
import { adapt } from "startable-adaptor";
import { createStartable } from "startable";



assert(process.env.TASKLIST_HOST_URI);
assert(process.env.TASKLIST_DB);
assert(process.env.TASKLIST_COLL);

class App {
	public $s = createStartable(
		this.rawStart.bind(this),
		this.rawStop.bind(this),
	);
	private executor?: Executor<Method, Params, Result, ErrDesc>;
	private host?: MongoClient;
	private db?: Db;
	private coll?: Collection<Document>;
	private stream?: ChangeStream<Document>;

	private adoption?: Adoption;
	private success?: Success;
	private failure?: Failure;

	private async rawStart() {
		this.host = new MongoClient(process.env.TASKLIST_HOST_URI!);
		this.host.on('close', () => void this.$s.stop());
		this.db = this.host.db(process.env.TASKLIST_DB!);
		this.coll = this.db.collection<Document>(process.env.TASKLIST_COLL!);
		this.stream = this.coll.watch();
		this.stream.on('close', () => void this.$s.stop());

		this.adoption = new Adoption(this.host, this.db, this.coll);
		this.success = new Success(this.host, this.db, this.coll);
		this.failure = new Failure(this.host, this.db, this.coll);

		this.executor = new Executor(
			this.stream,
			this.adoption,
			this.success,
			this.failure,
			'capture',
			execute,
		);
		await this.executor.$s.start(this.$s.stop);
	}

	private async rawStop() {
		if (this.executor) await this.executor.$s.stop();
		if (this.stream) await this.stream.close();
		if (this.host) await this.host.close();
	}
}

adapt(new App().$s);
