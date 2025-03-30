"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertHasUser = assertHasUser;
function assertHasUser(req) {
    if (!("user" in req)) {
        throw new Error("Request object without user found unexpectedly");
    }
}
//# sourceMappingURL=assertHasUser.js.map