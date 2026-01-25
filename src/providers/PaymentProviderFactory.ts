import { PaymentProvider } from './PaymentProvider';
import { PaystackProvider } from './PaystackProvider';
import { KoraProvider } from './KoraProvider';
import { PaymentProviderType } from '../types/payment.types';

let currentProvider: PaymentProviderType = (process.env.PAYMENT_PROVIDER as PaymentProviderType) || 'paystack';

const providers: Record<PaymentProviderType, () => PaymentProvider> = {
    paystack: () => new PaystackProvider(),
    kora: () => new KoraProvider(),
};

export function getPaymentProvider(): PaymentProvider {
    return providers[currentProvider]();
}

export function setPaymentProvider(provider: PaymentProviderType): void {
    currentProvider = provider;
}

export function getCurrentProviderType(): PaymentProviderType {
    return currentProvider;
}

export { PaymentProvider, PaystackProvider, KoraProvider };
