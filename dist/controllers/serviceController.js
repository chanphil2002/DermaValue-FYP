"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.createService = exports.getService = exports.getServices = void 0;
const service_1 = __importDefault(require("../models/service"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const getServices = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const services = yield service_1.default.find().populate("clinic clinicians").exec();
        res.locals.isIndexPage = true;
        res.render("home", { services });
    }
    catch (error) {
        next(error);
    }
});
exports.getServices = getServices;
const getService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const serviceId = req.params.id;
    try {
        if (!mongoose_1.default.isValidObjectId(serviceId)) {
            throw (0, http_errors_1.default)(400, "Invalid service ID");
        }
        const service = yield service_1.default.findById(serviceId).populate("clinic clinicians").exec();
        if (!service) {
            throw (0, http_errors_1.default)(404, "Service not found");
        }
        res.status(200).json(service);
    }
    catch (error) {
        next(error);
    }
});
exports.getService = getService;
const createService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    try {
        if (!name) {
            throw (0, http_errors_1.default)(400, "All fields are required (name, description, price, clinic)");
        }
        const newService = new service_1.default({
            name
        });
        yield newService.save();
        res.status(201).json({ message: "Clinic created successfully", newService });
    }
    catch (error) {
        next(error);
    }
});
exports.createService = createService;
const updateService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const serviceId = req.params.id;
    const { name } = req.body;
    try {
        if (!mongoose_1.default.isValidObjectId(serviceId)) {
            throw (0, http_errors_1.default)(400, "Invalid service ID");
        }
        const service = yield service_1.default.findById(serviceId).exec();
        if (!service) {
            throw (0, http_errors_1.default)(404, "Service not found");
        }
        if (name)
            service.name = name;
        const updatedService = yield service.save();
        res.status(200).json(updatedService);
    }
    catch (error) {
        next(error);
    }
});
exports.updateService = updateService;
const deleteService = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const serviceId = req.params.id;
    try {
        if (!mongoose_1.default.isValidObjectId(serviceId)) {
            throw (0, http_errors_1.default)(400, "Invalid service ID");
        }
        const service = yield service_1.default.findByIdAndDelete(serviceId).exec();
        if (!service) {
            throw (0, http_errors_1.default)(404, "Service not found");
        }
        res.sendStatus(204);
    }
    catch (error) {
        next(error);
    }
});
exports.deleteService = deleteService;
//# sourceMappingURL=serviceController.js.map