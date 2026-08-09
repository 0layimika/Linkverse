import { PaymentProvider } from './PaymentProvider';
import { PaystackProvider } from './PaystackProvider';
import { KoraProvider } from './KoraProvider';
import { BachsProvider } from './BachsProvider';
import { PaymentProviderType } from '../types/payment.types';
import { PAYMENT_PROVIDER } from '../config/env';

let currentProvider: PaymentProviderType = (PAYMENT_PROVIDER as PaymentProviderType) || 'paystack';

const providers: Record<PaymentProviderType, () => PaymentProvider> = {
    paystack: () => new PaystackProvider(),
    kora: () => new KoraProvider(),
    bachs: () => new BachsProvider(),
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

export { PaymentProvider, PaystackProvider, KoraProvider, BachsProvider };
