"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const envalid_1 = require("envalid");
exports.default = (0, envalid_1.cleanEnv)(process.env, {
    LOCAL_MONGO: (0, envalid_1.str)(),
    PORT: (0, envalid_1.port)(),
});
//# sourceMappingURL=validateEnv.js.map