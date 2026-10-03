
-- ============ PROFILES & ROLES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  phone text,
  email text,
  avatar_url text,
  address text,
  dietary_prefs text[] DEFAULT '{}',
  allergies text[] DEFAULT '{}',
  loyalty_points integer DEFAULT 0,
  loyalty_tier text DEFAULT 'bronze',
  total_orders integer DEFAULT 0,
  total_spent numeric(10,2) DEFAULT 0,
  referral_code text UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin','admin','kitchen_staff','waiter','customer')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','admin','kitchen_staff','waiter'))
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- ============ SETTINGS ============
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name text DEFAULT 'CHEFSTATION',
  currency text DEFAULT 'INR',
  currency_symbol text DEFAULT '₹',
  timezone text DEFAULT 'Asia/Kolkata',
  tax_rate numeric(5,2) DEFAULT 5.00,
  service_charge numeric(5,2) DEFAULT 0.00,
  address text DEFAULT '42 Gourmet Lane, Park Street, Kolkata 700016',
  phone text DEFAULT '+91 98765 43210',
  email text DEFAULT 'hello@chefstation.in',
  opening_time time DEFAULT '11:00:00',
  closing_time time DEFAULT '23:00:00',
  order_ready_time integer DEFAULT 15,
  reservation_duration integer DEFAULT 90,
  is_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update settings" ON public.settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
INSERT INTO public.settings (restaurant_name) VALUES ('CHEFSTATION');

-- ============ MENU ============
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads visible categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  original_price numeric(10,2),
  image_url text,
  dietary_tags text[] DEFAULT '{}',
  allergen_info text[] DEFAULT '{}',
  calories integer,
  preparation_time integer DEFAULT 15,
  is_available boolean DEFAULT true,
  is_bestseller boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  spice_level integer DEFAULT 0,
  customization_groups jsonb DEFAULT '[]',
  serving_size text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads menu items" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage menu items" ON public.menu_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE INDEX idx_menu_items_category ON public.menu_items(category_id);

-- ============ TABLES ============
CREATE TABLE public.tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number text NOT NULL UNIQUE,
  name text,
  capacity integer NOT NULL DEFAULT 4,
  shape text DEFAULT 'round',
  section text DEFAULT 'indoor',
  x_position integer DEFAULT 0,
  y_position integer DEFAULT 0,
  status text DEFAULT 'available' CHECK (status IN ('available','occupied','reserved','cleaning')),
  current_order_id uuid,
  assigned_waiter_id uuid REFERENCES public.profiles(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.tables TO anon, authenticated;
GRANT ALL ON public.tables TO service_role;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads tables" ON public.tables FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage tables" ON public.tables FOR ALL TO authenticated USING (public.is_staff(auth.uid()));

-- ============ ORDERS ============
CREATE SEQUENCE public.order_number_seq START 1;
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT ('ORD-' || lpad(nextval('public.order_number_seq')::text, 4, '0')),
  customer_id uuid REFERENCES public.profiles(id),
  customer_name text,
  customer_phone text,
  table_id uuid REFERENCES public.tables(id),
  waiter_id uuid REFERENCES public.profiles(id),
  order_type text DEFAULT 'dine_in' CHECK (order_type IN ('dine_in','takeaway','delivery')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','ready','served','completed','cancelled','refunded')),
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  service_charge numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  discount_code text,
  total_amount numeric(10,2) DEFAULT 0,
  payment_method text DEFAULT 'cash',
  payment_status text DEFAULT 'pending',
  special_instructions text,
  delivery_address text,
  loyalty_points_used integer DEFAULT 0,
  loyalty_points_earned integer DEFAULT 0,
  estimated_ready_at timestamptz,
  ready_at timestamptz,
  served_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guests place and track orders" ON public.orders FOR SELECT TO anon USING (true);
CREATE POLICY "Guests create orders" ON public.orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Customers read own orders" ON public.orders FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Customers create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Customers rate own orders" ON public.orders FOR UPDATE TO authenticated USING (customer_id = auth.uid() AND status IN ('served','completed')) WITH CHECK (customer_id = auth.uid());
CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_orders_customer ON public.orders(customer_id, created_at);
CREATE INDEX idx_orders_status ON public.orders(status);

-- ============ RESERVATIONS ============
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.profiles(id),
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  table_id uuid REFERENCES public.tables(id),
  party_size integer NOT NULL DEFAULT 2,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  duration_minutes integer DEFAULT 90,
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','seated','completed','cancelled','no_show')),
  special_requests text,
  occasion text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.reservations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guests book tables" ON public.reservations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Customers read own reservations" ON public.reservations FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Customers create reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff manage reservations" ON public.reservations FOR ALL TO authenticated USING (public.is_staff(auth.uid()));
CREATE INDEX idx_reservations_date ON public.reservations(reservation_date);

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) UNIQUE,
  customer_id uuid REFERENCES public.profiles(id),
  customer_name text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  food_rating integer CHECK (food_rating BETWEEN 1 AND 5),
  service_rating integer CHECK (service_rating BETWEEN 1 AND 5),
  review_text text,
  is_featured boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  response_text text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Customers write reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Admins manage reviews" ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ INVENTORY ============
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text DEFAULT 'raw_material',
  unit text DEFAULT 'kg',
  current_stock numeric(10,3) DEFAULT 0,
  min_stock_level numeric(10,3) DEFAULT 0,
  unit_cost numeric(10,2) DEFAULT 0,
  storage_location text DEFAULT 'dry_storage',
  expiry_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read inventory" ON public.inventory_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admins manage inventory" ON public.inventory_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ LOYALTY ============
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.profiles(id) NOT NULL,
  type text DEFAULT 'earned',
  points integer NOT NULL,
  description text,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.loyalty_transactions TO authenticated;
GRANT ALL ON public.loyalty_transactions TO service_role;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read own points" ON public.loyalty_transactions FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_staff(auth.uid()));

-- ============ DISCOUNT CODES ============
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text DEFAULT 'percentage',
  discount_value numeric(10,2) NOT NULL,
  min_order_value numeric(10,2) DEFAULT 0,
  max_discount numeric(10,2),
  usage_limit integer,
  usage_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.discount_codes TO anon, authenticated;
GRANT ALL ON public.discount_codes TO service_role;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active codes" ON public.discount_codes FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage codes" ON public.discount_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  type text DEFAULT 'order',
  title text NOT NULL,
  message text,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users mark own read" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;

-- ============ SEED DATA ============
INSERT INTO public.categories (name, description, sort_order) VALUES
  ('Starters', 'Small plates to begin', 1),
  ('Mains', 'Signature curries and grills', 2),
  ('Biryani & Rice', 'Slow-cooked aromatic rice', 3),
  ('Breads', 'Fresh from the tandoor', 4),
  ('Desserts', 'Sweet endings', 5),
  ('Beverages', 'Refreshers and classics', 6);

INSERT INTO public.menu_items (category_id, name, description, price, original_price, dietary_tags, allergen_info, calories, preparation_time, is_bestseller, is_featured, spice_level, serving_size, sort_order) VALUES
  ((SELECT id FROM public.categories WHERE name='Starters'), 'Paneer Tikka', 'Char-grilled cottage cheese marinated in smoked yogurt and spices', 240, 280, ARRAY['vegetarian','gluten-free'], ARRAY['dairy'], 320, 12, true, true, 2, '8 pieces', 1),
  ((SELECT id FROM public.categories WHERE name='Starters'), 'Chicken 65', 'Fiery South Indian fried chicken with curry leaves and red chillies', 260, NULL, ARRAY['spicy'], ARRAY[]::text[], 410, 15, true, false, 4, '250g', 2),
  ((SELECT id FROM public.categories WHERE name='Starters'), 'Crispy Corn Salt & Pepper', 'Golden fried corn kernels tossed with cracked pepper and spring onion', 190, NULL, ARRAY['vegetarian','vegan'], ARRAY[]::text[], 280, 10, false, false, 1, '200g', 3),
  ((SELECT id FROM public.categories WHERE name='Starters'), 'Tandoori Wings', 'Smoky chicken wings from the clay oven with mint chutney', 290, NULL, ARRAY['spicy','gluten-free'], ARRAY[]::text[], 380, 18, false, false, 3, '6 pieces', 4),
  ((SELECT id FROM public.categories WHERE name='Mains'), 'Butter Chicken', 'Tandoori chicken simmered in a velvety tomato-butter gravy', 320, 380, ARRAY['gluten-free'], ARRAY['dairy','nuts'], 520, 20, true, true, 2, 'full', 1),
  ((SELECT id FROM public.categories WHERE name='Mains'), 'Dal Makhani', 'Black lentils slow-cooked overnight with butter and cream', 240, NULL, ARRAY['vegetarian','gluten-free'], ARRAY['dairy'], 380, 15, true, false, 1, 'full', 2),
  ((SELECT id FROM public.categories WHERE name='Mains'), 'Kadhai Paneer', 'Cottage cheese tossed with charred peppers and crushed coriander', 280, NULL, ARRAY['vegetarian'], ARRAY['dairy'], 420, 15, false, false, 2, 'full', 3),
  ((SELECT id FROM public.categories WHERE name='Mains'), 'Mutton Rogan Josh', 'Slow-braised lamb in Kashmiri chilli and warming spices', 420, NULL, ARRAY['gluten-free'], ARRAY[]::text[], 560, 30, false, true, 3, 'full', 4),
  ((SELECT id FROM public.categories WHERE name='Mains'), 'Malai Kofta', 'Soft paneer dumplings in a rich cashew-cream gravy', 290, NULL, ARRAY['vegetarian'], ARRAY['dairy','nuts'], 480, 18, false, false, 1, 'full', 5),
  ((SELECT id FROM public.categories WHERE name='Biryani & Rice'), 'Hyderabadi Chicken Biryani', 'Dum-cooked basmati layered with saffron and spiced chicken', 340, 400, ARRAY['gluten-free'], ARRAY['dairy'], 620, 35, true, true, 3, 'full', 1),
  ((SELECT id FROM public.categories WHERE name='Biryani & Rice'), 'Vegetable Dum Biryani', 'Garden vegetables and basmati sealed and slow-steamed', 260, NULL, ARRAY['vegetarian'], ARRAY['dairy'], 480, 30, false, false, 2, 'full', 2),
  ((SELECT id FROM public.categories WHERE name='Biryani & Rice'), 'Jeera Rice', 'Basmati tempered with ghee and toasted cumin', 140, NULL, ARRAY['vegetarian','vegan','gluten-free'], ARRAY[]::text[], 300, 8, false, false, 0, 'full', 3),
  ((SELECT id FROM public.categories WHERE name='Breads'), 'Butter Naan', 'Pillowy tandoor flatbread brushed with butter', 60, NULL, ARRAY['vegetarian'], ARRAY['gluten','dairy'], 220, 5, true, false, 0, '1 piece', 1),
  ((SELECT id FROM public.categories WHERE name='Breads'), 'Garlic Naan', 'Naan studded with roasted garlic and coriander', 80, NULL, ARRAY['vegetarian'], ARRAY['gluten','dairy'], 260, 6, false, false, 0, '1 piece', 2),
  ((SELECT id FROM public.categories WHERE name='Breads'), 'Tandoori Roti', 'Whole-wheat flatbread from the clay oven', 40, NULL, ARRAY['vegetarian','vegan'], ARRAY['gluten'], 150, 5, false, false, 0, '1 piece', 3),
  ((SELECT id FROM public.categories WHERE name='Desserts'), 'Gulab Jamun', 'Warm milk dumplings soaked in rose-cardamom syrup', 120, NULL, ARRAY['vegetarian'], ARRAY['dairy','gluten'], 340, 5, true, false, 0, '4 pieces', 1),
  ((SELECT id FROM public.categories WHERE name='Desserts'), 'Kulfi Falooda', 'Dense pistachio kulfi over vermicelli and rose syrup', 160, NULL, ARRAY['vegetarian'], ARRAY['dairy','nuts'], 420, 5, false, true, 0, '1 serving', 2),
  ((SELECT id FROM public.categories WHERE name='Desserts'), 'Chocolate Lava Cake', 'Molten-centre dark chocolate cake with vanilla bean ice cream', 180, NULL, ARRAY['vegetarian'], ARRAY['dairy','gluten'], 460, 12, false, false, 0, '1 piece', 3),
  ((SELECT id FROM public.categories WHERE name='Beverages'), 'Mango Lassi', 'Churned yogurt with Alphonso mango and cardamom', 110, NULL, ARRAY['vegetarian','gluten-free'], ARRAY['dairy'], 210, 4, true, false, 0, '300ml', 1),
  ((SELECT id FROM public.categories WHERE name='Beverages'), 'Masala Chai', 'Spiced milk tea brewed with ginger and cardamom', 60, NULL, ARRAY['vegetarian','gluten-free'], ARRAY['dairy'], 90, 5, false, false, 0, '250ml', 2),
  ((SELECT id FROM public.categories WHERE name='Beverages'), 'Virgin Mint Mojito', 'Muddled mint, lime and soda over crushed ice', 130, NULL, ARRAY['vegetarian','vegan','gluten-free'], ARRAY[]::text[], 80, 4, false, false, 0, '350ml', 3);

INSERT INTO public.tables (table_number, name, capacity, shape, section, x_position, y_position, status) VALUES
  ('T1', 'Window Two', 2, 'round', 'indoor', 40, 40, 'available'),
  ('T2', 'Window Four', 4, 'round', 'indoor', 160, 40, 'occupied'),
  ('T3', 'Centre Six', 6, 'rectangle', 'indoor', 300, 40, 'available'),
  ('T4', 'Booth One', 4, 'booth', 'indoor', 40, 160, 'reserved'),
  ('T5', 'Booth Two', 6, 'booth', 'indoor', 180, 160, 'available'),
  ('T6', 'Family Eight', 8, 'rectangle', 'indoor', 320, 160, 'available'),
  ('O1', 'Patio Two', 2, 'round', 'outdoor', 40, 280, 'available'),
  ('O2', 'Patio Four', 4, 'round', 'outdoor', 160, 280, 'cleaning'),
  ('B1', 'Bar Seat 1', 1, 'bar', 'bar', 300, 280, 'available'),
  ('B2', 'Bar Seat 2', 1, 'bar', 'bar', 360, 280, 'available');

INSERT INTO public.inventory_items (name, category, unit, current_stock, min_stock_level, unit_cost, storage_location) VALUES
  ('Chicken', 'raw_material', 'kg', 18, 10, 220, 'cold_storage'),
  ('Paneer', 'dairy', 'kg', 6, 5, 320, 'cold_storage'),
  ('Basmati Rice', 'raw_material', 'kg', 45, 20, 95, 'dry_storage'),
  ('Tomatoes', 'raw_material', 'kg', 4, 8, 40, 'cold_storage'),
  ('Cooking Oil', 'raw_material', 'liter', 12, 10, 160, 'dry_storage'),
  ('Butter', 'dairy', 'kg', 3, 4, 480, 'cold_storage'),
  ('Cashews', 'spices', 'kg', 2, 2, 900, 'dry_storage'),
  ('Mint Leaves', 'raw_material', 'bunch', 15, 10, 20, 'cold_storage');

INSERT INTO public.discount_codes (code, description, discount_type, discount_value, min_order_value, max_discount, valid_until) VALUES
  ('WELCOME20', '20% off your first order', 'percentage', 20, 299, 150, now() + interval '90 days'),
  ('FESTIVE50', 'Flat ₹50 off orders above ₹499', 'fixed_amount', 50, 499, NULL, now() + interval '30 days');

INSERT INTO public.reviews (customer_name, rating, food_rating, service_rating, review_text, is_featured) VALUES
  ('Ananya S.', 5, 5, 5, 'The butter chicken is easily the best in the city. Warm lighting, warmer service.', true),
  ('Rahul M.', 5, 5, 4, 'Ordered via QR at the table — food arrived hot in 15 minutes. Brilliant system.', true),
  ('Priya K.', 4, 5, 4, 'Hyderabadi biryani lives up to the hype. Will be back for the kulfi falooda.', true);
