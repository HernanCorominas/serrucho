-- SERRUCHO MVP SCHEMA MIGRATION
-- Database: PostgreSQL (Supabase)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles (Organizers)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Serruchos (Group Expense Plans)
CREATE TABLE IF NOT EXISTS public.serruchos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'DOP',
    event_date DATE,
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')) DEFAULT 'OPEN',
    payment_instructions TEXT,
    payment_deadline DATE,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Participants
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serrucho_id UUID NOT NULL REFERENCES public.serruchos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    preferred_channel TEXT NOT NULL CHECK (preferred_channel IN ('EMAIL', 'WHATSAPP')) DEFAULT 'EMAIL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serrucho_id UUID NOT NULL REFERENCES public.serruchos(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    paid_by_participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    split_method TEXT NOT NULL CHECK (split_method IN ('EQUAL', 'PERCENTAGE')) DEFAULT 'EQUAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Expense Participants (Splits)
CREATE TABLE IF NOT EXISTS public.expense_participants (
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    percentage_basis_points INTEGER CHECK (percentage_basis_points IS NULL OR (percentage_basis_points >= 0 AND percentage_basis_points <= 10000)),
    owed_cents BIGINT NOT NULL CHECK (owed_cents >= 0),
    PRIMARY KEY (expense_id, participant_id)
);

-- 7. Settlement Snapshots (Immutable financial records upon closure)
CREATE TABLE IF NOT EXISTS public.settlement_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serrucho_id UUID NOT NULL REFERENCES public.serruchos(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    total_expenses_cents BIGINT NOT NULL,
    owed_cents BIGINT NOT NULL,
    paid_cents BIGINT NOT NULL,
    balance_cents BIGINT NOT NULL,
    payment_instructions TEXT,
    payment_deadline DATE,
    public_token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Settlement Items (Snapshot line items)
CREATE TABLE IF NOT EXISTS public.settlement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES public.settlement_snapshots(id) ON DELETE CASCADE,
    expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    paid_by_name TEXT NOT NULL,
    amount_cents BIGINT NOT NULL,
    participant_owed_cents BIGINT NOT NULL
);

-- 9. Notification Logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serrucho_id UUID NOT NULL REFERENCES public.serruchos(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    snapshot_id UUID REFERENCES public.settlement_snapshots(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'WHATSAPP')),
    destination_masked TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'SKIPPED')),
    provider_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_serruchos_owner ON public.serruchos(owner_id);
CREATE INDEX IF NOT EXISTS idx_participants_serrucho ON public.participants(serrucho_id);
CREATE INDEX IF NOT EXISTS idx_expenses_serrucho ON public.expenses(serrucho_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_participant ON public.expense_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_settlement_snapshots_serrucho ON public.settlement_snapshots(serrucho_id);
CREATE INDEX IF NOT EXISTS idx_settlement_snapshots_token ON public.settlement_snapshots(public_token_hash);
CREATE INDEX IF NOT EXISTS idx_settlement_items_snapshot ON public.settlement_items(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_serrucho ON public.notification_logs(serrucho_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serruchos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Serruchos: Owners have full CRUD on their own serruchos
CREATE POLICY "Owners can manage own serruchos" ON public.serruchos
    FOR ALL USING (auth.uid() = owner_id);

-- Participants: Owners can manage participants of their serruchos
CREATE POLICY "Owners can manage participants" ON public.participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.serruchos
            WHERE serruchos.id = participants.serrucho_id
            AND serruchos.owner_id = auth.uid()
        )
    );

-- Expenses: Owners can manage expenses
CREATE POLICY "Owners can manage expenses" ON public.expenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.serruchos
            WHERE serruchos.id = expenses.serrucho_id
            AND serruchos.owner_id = auth.uid()
        )
    );

-- Expense Participants: Owners can manage expense splits
CREATE POLICY "Owners can manage expense splits" ON public.expense_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.expenses
            JOIN public.serruchos ON serruchos.id = expenses.serrucho_id
            WHERE expenses.id = expense_participants.expense_id
            AND serruchos.owner_id = auth.uid()
        )
    );

-- Settlement Snapshots: Owners can view and create snapshots
CREATE POLICY "Owners can manage snapshots" ON public.settlement_snapshots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.serruchos
            WHERE serruchos.id = settlement_snapshots.serrucho_id
            AND serruchos.owner_id = auth.uid()
        )
    );

-- Settlement Items: Owners can view snapshot items
CREATE POLICY "Owners can manage snapshot items" ON public.settlement_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.settlement_snapshots
            JOIN public.serruchos ON serruchos.id = settlement_snapshots.serrucho_id
            WHERE settlement_snapshots.id = settlement_items.snapshot_id
            AND serruchos.owner_id = auth.uid()
        )
    );

-- Notification Logs: Owners can view logs
CREATE POLICY "Owners can view notification logs" ON public.notification_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.serruchos
            WHERE serruchos.id = notification_logs.serrucho_id
            AND serruchos.owner_id = auth.uid()
        )
    );

-- Public access policy for settlement receipts via token hash (READ ONLY)
CREATE POLICY "Public can view settlement snapshot by token" ON public.settlement_snapshots
    FOR SELECT USING (true);

CREATE POLICY "Public can view settlement items by snapshot" ON public.settlement_items
    FOR SELECT USING (true);
