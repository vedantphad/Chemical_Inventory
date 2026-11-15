/*
# Create shared laboratory reagent inventory

1. New Tables
- `reagents` stores the shared chemical inventory for the academic laboratory.
- `id` is the stable identifier used by the dashboard and QR labels.
- `name`, `formula`, and `cas_number` identify the reagent.
- `category` groups reagents for filtering.
- `location` records the cabinet or shelf where the container lives.
- `quantity` and `unit` record the current amount available.
- `minimum_quantity` defines the restock threshold.
- `expiry_date` records the date by which the reagent should be reviewed.
- `updated_by` records the latest staff or researcher initials.
- `created_at` and `updated_at` support audit-friendly recency labels.

2. Security
- Row level security is enabled on `reagents`.
- This is an intentionally shared, no-sign-in laboratory workspace, so the anon and authenticated roles receive only the CRUD access used by the dashboard.
- Four separate policies allow shared reads, inserts, updates, and deletes.

3. Seed Data
- Adds a small representative inventory so the dashboard is useful immediately after setup.
- Seed rows are inserted only when their stable IDs are not already present.

4. Important Notes
- Inventory quantity and threshold values are numeric and are displayed with their stored units.
- `updated_at` is refreshed by the application when a row is changed.
*/

CREATE TABLE IF NOT EXISTS public.reagents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  formula text NOT NULL DEFAULT '',
  cas_number text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  location text NOT NULL DEFAULT 'Unassigned',
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit text NOT NULL DEFAULT 'g',
  minimum_quantity numeric NOT NULL DEFAULT 0 CHECK (minimum_quantity >= 0),
  expiry_date date,
  updated_by text NOT NULL DEFAULT 'Lab team',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reagents ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reagents TO anon, authenticated;

DROP POLICY IF EXISTS "Shared users can read reagents" ON public.reagents;
CREATE POLICY "Shared users can read reagents"
  ON public.reagents FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Shared users can add reagents" ON public.reagents;
CREATE POLICY "Shared users can add reagents"
  ON public.reagents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Shared users can update reagents" ON public.reagents;
CREATE POLICY "Shared users can update reagents"
  ON public.reagents FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Shared users can remove reagents" ON public.reagents;
CREATE POLICY "Shared users can remove reagents"
  ON public.reagents FOR DELETE
  TO anon, authenticated
  USING (true);

INSERT INTO public.reagents (id, name, formula, cas_number, category, location, quantity, unit, minimum_quantity, expiry_date, updated_by)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'Sodium chloride', 'NaCl', '7647-14-5', 'Inorganic salts', 'Cabinet A · Shelf 02', 780, 'g', 250, '2027-04-18', 'AK'),
  ('10000000-0000-4000-8000-000000000002', 'Acetic acid', 'CH₃COOH', '64-19-7', 'Acids', 'Cabinet B · Shelf 01', 1.8, 'L', 0.75, '2026-12-06', 'MR'),
  ('10000000-0000-4000-8000-000000000003', 'Ethanol, absolute', 'C₂H₅OH', '64-17-5', 'Solvents', 'Flammable store · 03', 420, 'mL', 500, '2026-11-28', 'SP'),
  ('10000000-0000-4000-8000-000000000004', 'Copper sulfate pentahydrate', 'CuSO₄·5H₂O', '7758-99-8', 'Inorganic salts', 'Cabinet A · Shelf 04', 96, 'g', 50, '2028-02-12', 'JL'),
  ('10000000-0000-4000-8000-000000000005', 'Hydrogen peroxide', 'H₂O₂', '7722-84-1', 'Oxidizers', 'Cabinet C · Shelf 02', 320, 'mL', 400, '2026-10-30', 'AK'),
  ('10000000-0000-4000-8000-000000000006', 'Tris base', 'C₄H₁₁NO₃', '77-86-1', 'Buffers', 'Cabinet D · Shelf 01', 450, 'g', 200, '2029-06-21', 'MR')
ON CONFLICT (id) DO NOTHING;