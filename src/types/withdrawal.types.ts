/** An unexecuted quote lives only in Redis until its absolute expiry. */
export interface CachedWithdrawalQuote {
    id: string;
    creator_id: number;
    wallet_id: number;
    bank_account_id: number;
    bank_snapshot: { account_number: string; account_name: string; bank_code: string; bank_name: string; updated_at: string };
    recipient_code: string;
    payout_email: string | null;
    provider: string;
    currency: 'NGN' | 'USD';
    amount: string;
    fee: string;
    total_debit: string;
    receive_amount: string;
    receive_currency: string;
    exchange_rate: string | null;
    provider_quote_id: string | null;
    provider_quote: Record<string, unknown> | null;
    expires_at: string;
    reference: string;
}

/** Durable payout accounting and recovery state, created only during execution. */
export interface WithdrawalPayout extends CachedWithdrawalQuote {
    status: 'submitting' | 'submitted' | 'completed' | 'failed';
    transaction_id: number;
    fee_transaction_id: number | null;
    submission_state: 'prepared' | 'in_flight' | 'unknown' | 'accepted' | 'terminal';
    attempts: number;
    first_submitted_at: Date | string | null;
    lease_expires_at: Date | string | null;
    next_reconcile_at: Date | string | null;
    provider_payout_id: string | null;
    provider_payout: Record<string, unknown> | null;
    error_message: string | null;
    created_at: Date | string;
    updated_at: Date | string;
}
