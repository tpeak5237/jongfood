BEGIN;

CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campuses (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name jsonb NOT NULL,
  city text NOT NULL,
  time_zone text NOT NULL DEFAULT 'Asia/Bangkok',
  currency text NOT NULL DEFAULT 'THB',
  UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  display_name jsonb NOT NULL,
  role text NOT NULL CHECK (role IN ('STUDENT', 'VENDOR_STAFF', 'MANAGER', 'ORG_ADMIN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email),
  UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS vendors (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campus_id text NOT NULL,
  slug text NOT NULL,
  name jsonb NOT NULL,
  description jsonb NOT NULL,
  emoji text NOT NULL,
  image_url text,
  service_open boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, campus_id) REFERENCES campuses(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_staff (
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id text NOT NULL,
  user_id text NOT NULL,
  staff_role text NOT NULL DEFAULT 'STAFF' CHECK (staff_role IN ('STAFF', 'MANAGER')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (vendor_id, user_id),
  FOREIGN KEY (organization_id, vendor_id) REFERENCES vendors(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, user_id) REFERENCES users(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS menus (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id text NOT NULL,
  name jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, vendor_id) REFERENCES vendors(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  menu_id text NOT NULL,
  name jsonb NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, menu_id) REFERENCES menus(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS menu_items (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id text NOT NULL,
  menu_id text NOT NULL,
  category_id text,
  name jsonb NOT NULL,
  description jsonb NOT NULL,
  price_minor integer NOT NULL CHECK (price_minor >= 0),
  capacity_units numeric(10, 2) NOT NULL CHECK (capacity_units >= 0),
  emoji text NOT NULL,
  image_url text,
  available boolean NOT NULL DEFAULT true,
  preparation_minutes integer NOT NULL DEFAULT 5 CHECK (preparation_minutes >= 0),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, vendor_id) REFERENCES vendors(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, menu_id) REFERENCES menus(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, category_id) REFERENCES menu_categories(organization_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS menu_modifiers (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id text NOT NULL,
  menu_item_id text NOT NULL,
  name jsonb NOT NULL,
  required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, vendor_id) REFERENCES vendors(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, menu_item_id) REFERENCES menu_items(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS menu_modifier_options (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  modifier_id text NOT NULL,
  name jsonb NOT NULL,
  price_minor integer NOT NULL DEFAULT 0 CHECK (price_minor >= 0),
  capacity_units numeric(10, 2) NOT NULL DEFAULT 0 CHECK (capacity_units >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, modifier_id) REFERENCES menu_modifiers(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS availability_windows (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id text NOT NULL,
  menu_item_id text,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  starts_local time NOT NULL,
  ends_local time NOT NULL,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, vendor_id) REFERENCES vendors(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, menu_item_id) REFERENCES menu_items(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pickup_slots (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id text NOT NULL,
  service_date date NOT NULL,
  label text NOT NULL,
  cutoff_at timestamptz,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  max_orders integer NOT NULL CHECK (max_orders > 0),
  max_capacity_units numeric(10, 2) NOT NULL CHECK (max_capacity_units > 0),
  booked_orders integer NOT NULL DEFAULT 0 CHECK (booked_orders >= 0),
  booked_capacity_units numeric(10, 2) NOT NULL DEFAULT 0 CHECK (booked_capacity_units >= 0),
  closed boolean NOT NULL DEFAULT false,
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, vendor_id) REFERENCES vendors(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id text NOT NULL,
  owner_id text NOT NULL,
  pickup_slot_id text,
  order_ref text NOT NULL,
  queue_number text NOT NULL,
  order_type text NOT NULL CHECK (order_type IN ('PREORDER', 'WALK_IN')),
  status text NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COLLECTED', 'CANCELLED', 'REJECTED', 'NO_SHOW')),
  subtotal_minor integer NOT NULL CHECK (subtotal_minor >= 0),
  service_fee_minor integer NOT NULL CHECK (service_fee_minor >= 0),
  total_minor integer NOT NULL CHECK (total_minor >= 0),
  capacity_units numeric(10, 2) NOT NULL CHECK (capacity_units >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('PAY_AT_PICKUP', 'MANUAL_CONFIRMED')),
  payment_status text NOT NULL CHECK (payment_status IN ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  estimated_ready_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  ready_at timestamptz,
  collected_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, order_ref),
  UNIQUE (organization_id, id),
  FOREIGN KEY (organization_id, vendor_id) REFERENCES vendors(organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, owner_id) REFERENCES users(organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, pickup_slot_id) REFERENCES pickup_slots(organization_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS order_items (
  id bigserial PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  vendor_id text NOT NULL,
  menu_item_id text NOT NULL,
  item_name jsonb NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_minor integer NOT NULL CHECK (price_minor >= 0),
  capacity_units numeric(10, 2) NOT NULL CHECK (capacity_units >= 0),
  modifiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  FOREIGN KEY (organization_id, order_id) REFERENCES orders(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, vendor_id) REFERENCES vendors(organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, menu_item_id) REFERENCES menu_items(organization_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS order_status_events (
  id bigserial PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  actor_id text,
  from_status text,
  to_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, order_id) REFERENCES orders(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, actor_id) REFERENCES users(organization_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  method text NOT NULL CHECK (method IN ('PAY_AT_PICKUP', 'MANUAL_CONFIRMED')),
  status text NOT NULL CHECK (status IN ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, order_id),
  FOREIGN KEY (organization_id, order_id) REFERENCES orders(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  order_id text,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, user_id) REFERENCES users(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, order_id) REFERENCES orders(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_events (
  id bigserial PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id text,
  vendor_id text,
  order_id text,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, actor_id) REFERENCES users(organization_id, id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id, vendor_id) REFERENCES vendors(organization_id, id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id, order_id) REFERENCES orders(organization_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, user_id) REFERENCES users(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  key text NOT NULL,
  fingerprint text NOT NULL,
  order_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id, key),
  FOREIGN KEY (organization_id, user_id) REFERENCES users(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, order_id) REFERENCES orders(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_queue_sequences (
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id text NOT NULL,
  service_date date NOT NULL,
  next_value integer NOT NULL DEFAULT 1 CHECK (next_value > 0),
  PRIMARY KEY (organization_id, vendor_id, service_date),
  FOREIGN KEY (organization_id, vendor_id) REFERENCES vendors(organization_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS vendors_org_campus_idx ON vendors (organization_id, campus_id);
CREATE INDEX IF NOT EXISTS vendor_staff_user_idx ON vendor_staff (organization_id, user_id, vendor_id);
CREATE INDEX IF NOT EXISTS menu_items_vendor_available_idx ON menu_items (organization_id, vendor_id, available);
CREATE INDEX IF NOT EXISTS pickup_slots_vendor_date_idx ON pickup_slots (organization_id, vendor_id, service_date, starts_at);
CREATE INDEX IF NOT EXISTS orders_owner_status_idx ON orders (organization_id, owner_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_vendor_status_idx ON orders (organization_id, vendor_id, status, created_at ASC);
CREATE INDEX IF NOT EXISTS order_status_events_order_idx ON order_status_events (organization_id, order_id, created_at);
CREATE INDEX IF NOT EXISTS audit_events_org_created_idx ON audit_events (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions (expires_at);

COMMIT;
