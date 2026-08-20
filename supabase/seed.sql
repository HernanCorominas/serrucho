-- SERRUCHO MVP SEED DATA
-- Demonstration: "Playa Las Terrenas 2026"

-- 1. Demo Profile
INSERT INTO public.profiles (id, email, full_name)
VALUES ('a0000000-0000-0000-0000-000000000001', 'organizador@serrucho.do', 'Carlos Gómez')
ON CONFLICT (id) DO NOTHING;

-- 2. Demo Serrucho
INSERT INTO public.serruchos (
    id, owner_id, name, description, currency, event_date, status, payment_instructions, payment_deadline
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Fin de Semana en Las Terrenas 🌴',
    'Villa, comida, gasolina y bebidas del coro de la playa.',
    'DOP',
    '2026-08-25',
    'OPEN',
    'Transferencia Banco BHD: Cuenta de Ahorros 1234567890 a nombre de Carlos Gómez, o por Banreservas / tPago al 809-555-0199',
    '2026-08-30'
) ON CONFLICT (id) DO NOTHING;

-- 3. Demo Participants
INSERT INTO public.participants (id, serrucho_id, name, email, phone, preferred_channel)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Carlos Gómez (Organizador)', 'carlos@serrucho.do', '8095550101', 'EMAIL'),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Juan Pérez', 'juan.perez@example.com', '8095550102', 'EMAIL'),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Pedro Rosario', 'pedro.rosario@example.com', '8095550103', 'WHATSAPP'),
    ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'María Santos', 'maria.santos@example.com', '8095550104', 'EMAIL')
ON CONFLICT (id) DO NOTHING;

-- 4. Demo Expenses
-- Expense 1: Villa (RD$ 24,000) paid by Carlos, split equally among all 4 (RD$ 6,000 each)
INSERT INTO public.expenses (id, serrucho_id, description, amount_cents, paid_by_participant_id, expense_date, split_method)
VALUES ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Alquiler de Villa frente a la playa', 2400000, 'c0000000-0000-0000-0000-000000000001', '2026-08-20', 'EQUAL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.expense_participants (expense_id, participant_id, percentage_basis_points, owed_cents)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 2500, 600000),
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 2500, 600000),
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 2500, 600000),
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 2500, 600000)
ON CONFLICT DO NOTHING;

-- Expense 2: Compra en Supermercado (RD$ 8,500) paid by Juan, split equally among all 4
INSERT INTO public.expenses (id, serrucho_id, description, amount_cents, paid_by_participant_id, expense_date, split_method)
VALUES ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Compra de comida y picadera en Supermercado Nacional', 850000, 'c0000000-0000-0000-0000-000000000002', '2026-08-21', 'EQUAL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.expense_participants (expense_id, participant_id, percentage_basis_points, owed_cents)
VALUES
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 2500, 212500),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 2500, 212500),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 2500, 212500),
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 2500, 212500)
ON CONFLICT DO NOTHING;

-- Expense 3: Gasolina y Peajes (RD$ 3,000) paid by Pedro, split only between Pedro, Juan, and Carlos (RD$ 1,000 each)
INSERT INTO public.expenses (id, serrucho_id, description, amount_cents, paid_by_participant_id, expense_date, split_method)
VALUES ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Gasolina y peaje Autopista del Nordeste', 300000, 'c0000000-0000-0000-0000-000000000003', '2026-08-21', 'EQUAL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.expense_participants (expense_id, participant_id, percentage_basis_points, owed_cents)
VALUES
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 3334, 100000),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 3333, 100000),
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 3333, 100000)
ON CONFLICT DO NOTHING;
