"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KoraProvider = exports.PaystackProvider = exports.PaymentProvider = void 0;
exports.getPaymentProvider = getPaymentProvider;
exports.setPaymentProvider = setPaymentProvider;
exports.getCurrentProviderType = getCurrentProviderType;
const PaymentProvider_1 = require("./PaymentProvider");
Object.defineProperty(exports, "PaymentProvider", { enumerable: true, get: function () { return PaymentProvider_1.PaymentProvider; } });
const PaystackProvider_1 = require("./PaystackProvider");
Object.defineProperty(exports, "PaystackProvider", { enumerable: true, get: function () { return PaystackProvider_1.PaystackProvider; } });
const KoraProvider_1 = require("./KoraProvider");
Object.defineProperty(exports, "KoraProvider", { enumerable: true, get: function () { return KoraProvider_1.KoraProvider; } });
let currentProvider = process.env.PAYMENT_PROVIDER || 'paystack';
const providers = {
    paystack: () => new PaystackProvider_1.PaystackProvider(),
    kora: () => new KoraProvider_1.KoraProvider(),
};
function getPaymentProvider() {
    return providers[currentProvider]();
}
function setPaymentProvider(provider) {
    currentProvider = provider;
}
function getCurrentProviderType() {
    return currentProvider;
}
//# sourceMappingURL=PaymentProviderFactory.js.map