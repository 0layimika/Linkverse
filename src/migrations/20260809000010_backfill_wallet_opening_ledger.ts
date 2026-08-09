import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex("wallets").select("id", "balance", "currency").then(async (wallets) => {
        for (const wallet of wallets) {
            const exists = await knex("wallet_ledger_entries").where({ wallet_id: wallet.id, reference: `opening_balance:${wallet.id}` }).first();
            if (exists) continue;
            const balance = Number(wallet.balance || 0);
            await knex("wallet_ledger_entries").insert({
                wallet_id: wallet.id,
                reference: `opening_balance:${wallet.id}`,
                entry_type: "opening_balance",
                direction: balance >= 0 ? "credit" : "debit",
                amount: Math.abs(balance),
                balance_before: 0,
                balance_after: balance,
                currency: wallet.currency,
                metadata: { migrated: true },
            });
        }
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex("wallet_ledger_entries").where("reference", "like", "opening_balance:%").del();
}
