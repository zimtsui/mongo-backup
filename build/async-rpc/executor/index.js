"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Executor = void 0;
const adoption_1 = require("./adoption");
class Executor {
    constructor(stream, adoption, success, failure, method, execute) {
        stream.on('change', async (notif) => {
            if (notif.operationType !== 'insert')
                return;
            if (notif.fullDocument.request.method !== method)
                return;
            const doc = await adoption.adopt(method);
            await execute(doc.request.params).then(result => void success.succeed(doc, result), (err) => void failure.fail(doc, err));
        });
        (async () => {
            try {
                for (;;) {
                    const doc = await adoption.adopt(method);
                    execute(doc.request.params).then(result => void success.succeed(doc, result), (err) => void failure.fail(doc, err));
                }
            }
            catch (err) {
                if (err instanceof adoption_1.Adoption.OrphanNotFound) { }
                else
                    throw err;
            }
        })();
    }
}
exports.Executor = Executor;
//# sourceMappingURL=index.js.map