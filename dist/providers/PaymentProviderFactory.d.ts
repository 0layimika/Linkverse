import { PaymentProvider } from './PaymentProvider';
import { PaystackProvider } from './PaystackProvider';
import { KoraProvider } from './KoraProvider';
import { PaymentProviderType } from '../types/payment.types';
export declare function getPaymentProvider(): PaymentProvider;
export declare function setPaymentProvider(provider: PaymentProviderType): void;
export declare function getCurrentProviderType(): PaymentProviderType;
export { PaymentProvider, PaystackProvider, KoraProvider };
//# sourceMappingURL=PaymentProviderFactory.d.ts.map