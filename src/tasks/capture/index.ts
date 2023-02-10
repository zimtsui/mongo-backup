import Router = require("@koa/router");
import * as Post from './post';

export interface InitialCtxState
	extends Post.InitialCtxState { }

export const router = new Router();
router.use(Post.router.routes());
