import { Executor } from "../../async-rpc/executor";
import assert = require("assert");
import { MongoClient } from "mongodb";
import { Document } from "../../async-rpc/interfaces";
import { Adoption } from "../../async-rpc/executor/adoption";
import { Success } from "../../async-rpc/executor/success";
import { Failure } from "../../async-rpc/executor/failure";
import { execute } from "./execute";
import { Method, Params, Result, ErrDesc } from "./interfaces";


assert(process.env.TASKLIST_HOST_URI);
assert(process.env.TASKLIST_DB);
assert(process.env.TASKLIST_COLL);


const host = new MongoClient(process.env.TASKLIST_HOST_URI);
const db = host.db(process.env.TASKLIST_DB);
const coll = db.collection<Document>(process.env.TASKLIST_COLL);
const stream = coll.watch();

const adoption = new Adoption(host, db, coll);
const success = new Success(host, db, coll);
const failure = new Failure(host, db, coll);


const executor = new Executor<Method, Params, Result, ErrDesc>(
	stream,
	adoption,
	success,
	failure,
	'capture',
	execute,
);
