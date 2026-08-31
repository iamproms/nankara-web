# Nankara Shop MVP Specification

## 1. Purpose

This document defines the **minimum viable product (MVP)** required to
add e-commerce functionality to the existing Nankara fashion website and
launch a complete, correct first version of the Shop. There is no schedule
pressure: scope is kept small deliberately, but everything inside that scope
is expected to be finished and working — not stubbed or left half-built.

The existing Home, About, Contact and other brand pages remain outside
this scope. The MVP focuses on one outcome:

> A customer can discover a Nankara piece, add it to their bag, provide
> delivery details, pay successfully, and create an order that the
> Nankara admin can manage.

Nankara's existing brand direction should remain intact: minimal,
premium, editorial, identity-driven, and image-led. The Shop should not
feel like a crowded marketplace.

The initial collection is **The Identity Collection #1**, with pieces
built around identities such as The Bold Statement Queen, The Power
Queen, The Soft Elegant Queen, The Luminous Queen, and The Quiet Power
Queen.

------------------------------------------------------------------------

## 2. Confirmed Business Rules

-   Nankara sells Ankara clothing and dresses.
-   Launch catalogue: **not more than 10 products**.
-   Products do **not** use normal colour or size variants for ordering.
-   Pieces are tailored to the customer's required size.
-   The customer will **not submit measurements during checkout in the
    MVP**.
-   Nankara will contact the customer **after successful payment** to
    obtain the required measurements.
-   Product availability is simply:
    -   `IN_STOCK`
    -   `OUT_OF_STOCK`
-   Products are uploaded and managed by **admin only**.
-   Checkout is available to guests; customer authentication is not
    required for launch.
-   The architecture must allow customer accounts to be added later
    without rebuilding orders or checkout.
-   Delivery is available within Nigeria and internationally.
-   Shipping fees will be based on destination.
-   Initial shipping prices can use **configurable dummy figures** until
    actual rates are supplied.
-   Paystack is the only payment gateway required for MVP.
-   Other gateways such as Stripe are post-MVP.
-   Nigerian customers see NGN prices.
-   International customers should see an **approximate USD
    equivalent**.
-   Orders are visible in the admin dashboard.
-   Email and WhatsApp order notifications are post-MVP.
-   Frontend: **Next.js**.
-   Backend: **Python + FastAPI**.
-   Database: **PostgreSQL**.
-   Product images should use external image storage/CDN such as
    Cloudinary.
-   Product URLs use human-readable slugs,
    e.g. `/shop/the-bold-statement-queen`.
-   Cart UX: **cart drawer plus a dedicated cart page**.

------------------------------------------------------------------------

# 3. MVP Boundary

## Build Now

1.  Shop/catalogue page
2.  Product detail page
3.  Product image gallery
4.  Product categories
5.  In-stock/out-of-stock state
6.  Guest cart
7.  Cart drawer
8.  Dedicated cart page
9.  Guest checkout
10. Destination-based shipping calculation
11. NGN pricing with approximate USD display for international visitors
12. Order creation
13. Paystack payment initialization
14. Paystack webhook handling and server-side verification
15. Payment success/failure handling
16. Admin authentication
17. Admin product management
18. Admin image uploads
19. Admin order management
20. Basic order statuses

## Explicitly Post-MVP

-   Customer signup/login
-   Customer account/dashboard
-   Saved addresses
-   Wishlist
-   Reviews
-   Comments or product Q&A
-   Coupons/promotions
-   Product recommendations
-   Advanced search
-   Advanced filtering
-   Stock quantities/reservations
-   Multiple product colour/size variants
-   WhatsApp notifications
-   Email notifications
-   Stripe or other payment gateways
-   Abandoned-cart recovery
-   Loyalty/rewards
-   Advanced analytics dashboard
-   Review photos
-   Automated courier/logistics integrations
-   Automated measurement collection

These features must **not block launch**.

------------------------------------------------------------------------

# 4. Customer Journey

``` text
Shop
  ↓
Product Detail
  ↓
Add to Bag
  ↓
Cart Drawer
  ├── Continue Shopping
  └── Checkout
        ↓
Customer + Delivery Information
        ↓
Shipping Fee Calculated
        ↓
Order Summary
        ↓
Pay with Paystack
        ↓
Backend Verifies Payment
        ↓
Order Confirmed
        ↓
Nankara Contacts Customer for Measurements
```

The measurement step happens operationally **after payment**, not in the
website checkout flow.

------------------------------------------------------------------------

# 5. Shop Page

**Route:** `/shop`

## Purpose

Present the collection visually while allowing customers to enter
individual product pages.

## Required Content

-   Collection heading
-   Short collection copy
-   Product grid
-   Product primary image
-   Product name
-   Product price
-   Approximate USD equivalent where appropriate
-   Availability state
-   Link to product detail page

Suggested collection copy from the existing brand material:

> You haven't just found a piece of clothing, you have discovered an
> expression of your unique story, identity and purpose.

## Filtering

Because launch contains fewer than 10 products, filtering must remain
minimal.

Acceptable MVP options:

-   `All`
-   Basic category tabs only if categories are genuinely useful

Do **not** build advanced filtering or search for launch.

## Visual Direction

-   Large photography
-   Generous whitespace
-   Minimal text
-   Editorial presentation
-   Mobile-first responsive grid
-   Avoid marketplace-style cards crowded with controls, badges and
    metadata

------------------------------------------------------------------------

# 6. Product Detail Page

**Route:** `/shop/[slug]`

Example:

``` text
/shop/the-bold-statement-queen
```

## Required Information

-   Product name
-   Price in NGN
-   Approximate USD equivalent for international visitors
-   Description
-   Category
-   Availability
-   Multiple product photographs
-   Quantity
-   Made-to-measure messaging
-   Add to Bag button

## Made-to-Measure Message

The interface should make it clear before purchase that the piece is
tailored to the customer and that Nankara will contact them after
payment for measurements.

Example:

> **Made for your fit**\
> This Nankara piece will be tailored to you. After your order is
> confirmed, our team will contact you to collect the measurements
> required for your piece.

No measurement form is required in the MVP.

## Out-of-Stock Behaviour

When `OUT_OF_STOCK`:

-   Product page remains accessible.
-   Product can still be viewed.
-   Add to Bag is disabled.
-   Clear `Out of Stock` messaging is displayed.

------------------------------------------------------------------------

# 7. Product Images

Each product supports:

-   One primary image
-   Multiple gallery images
-   Sort order
-   Alt text

Images should be stored through an image hosting/CDN service rather than
as database binary data.

Suggested product image record:

``` text
id
product_id
url
public_id
sort_order
is_primary
alt_text
```

The admin should be able to upload several angles when creating/editing
a product.

------------------------------------------------------------------------

# 8. Cart

## Guest Cart

Authentication is not required.

For MVP, the cart can be persisted client-side using local storage or an
equivalent browser mechanism.

The server remains authoritative for product price and availability at
checkout.

## Cart Item

A cart item needs:

``` text
product_id
quantity
```

No size or colour variant is required.

## Cart Drawer

Adding a product should open a side drawer without forcing the customer
away from the product/collection.

The drawer shows:

-   Product image
-   Product name
-   Price
-   Quantity controls
-   Remove action
-   Subtotal
-   Checkout button
-   View Bag link

## Cart Page

**Route:** `/cart`

Shows:

-   All cart items
-   Quantity controls
-   Remove action
-   Subtotal
-   Checkout CTA

------------------------------------------------------------------------

# 9. Price and Currency Display

## Base Currency

The backend should treat **NGN as the canonical/base product price** for
the MVP.

Example:

``` text
price_ngn = 150000
```

## International Display

International customers should see an approximate USD equivalent.

Example:

``` text
₦150,000
Approx. $98 USD
```

The USD amount is a **display conversion**, not a second manually
maintained product price.

### MVP Implementation

Create a currency conversion service/interface so that the source of the
NGN→USD rate can be changed later.

For the first implementation, the exchange rate may be configured
through application settings/environment configuration rather than
requiring a full foreign-exchange integration.

Example:

``` text
USD equivalent = NGN price / configured NGN-per-USD rate
```

The UI should identify converted prices as approximate where
appropriate.

### Important

The amount actually sent to Paystack must be calculated and validated by
the backend. The frontend must never be trusted to supply the
authoritative product price or payment total.

------------------------------------------------------------------------

# 10. Checkout

**Route:** `/checkout`

Checkout remains guest-first.

## Contact Fields

Required:

-   First name
-   Last name
-   Email
-   Phone / WhatsApp number

## Delivery Fields

Required as applicable:

-   Country
-   Address line 1
-   Address line 2 (optional)
-   City
-   State/Region
-   Postal/ZIP code
-   Delivery notes (optional)

## Order Summary

Show:

-   Product(s)
-   Quantity
-   Subtotal
-   Shipping
-   Total
-   Currency/payment information
-   Made-to-measure reminder

No account creation should interrupt checkout.

------------------------------------------------------------------------

# 11. Shipping

Shipping is destination-based and supports both Nigeria and
international destinations.

Actual production rates are not yet available. Therefore shipping must
be **configuration-driven**, not hard-coded throughout checkout.

## MVP Shipping Zones

Initial zones can resemble:

``` text
Nigeria
├── Rivers
├── Lagos
├── Abuja/FCT
└── Other Nigeria

International
├── West Africa
├── Rest of Africa
├── United Kingdom
├── United States / Canada
└── Rest of World
```

The exact grouping can be edited before production launch.

Each zone contains a configurable rate.

Example dummy configuration:

``` text
Rivers                  → ₦5,000
Lagos                   → ₦8,000
Other Nigeria           → ₦10,000
West Africa             → dummy rate
Rest of Africa          → dummy rate
United Kingdom          → dummy rate
United States / Canada  → dummy rate
Rest of World           → dummy rate
```

**Dummy figures must be replaced or explicitly approved before accepting
real customer orders.**

The backend determines the applicable zone and calculates shipping.

The frontend must not determine the authoritative shipping amount.

------------------------------------------------------------------------

# 12. Order Creation

An order should be created before redirecting/initializing payment.

Initial status:

``` text
PENDING_PAYMENT
```

An order must preserve a snapshot of the purchased item information.

This prevents future product price/name changes from altering historical
orders.

## Order Item Snapshot

``` text
product_id
product_name
product_slug
quantity
unit_price
subtotal
```

------------------------------------------------------------------------

# 13. Payment --- Paystack

Paystack is the only MVP payment gateway.

## Required Flow

``` text
Customer submits checkout
        ↓
Backend validates products and availability
        ↓
Backend recalculates prices
        ↓
Backend calculates shipping
        ↓
Backend calculates total
        ↓
Backend creates PENDING_PAYMENT order
        ↓
Backend initializes Paystack transaction
        ↓
Customer completes payment
        ↓
Paystack webhook reaches FastAPI
        ↓
Backend verifies webhook/transaction
        ↓
Order marked PAID
        ↓
Customer sees confirmation
```

## Critical Payment Rules

-   Never trust totals sent from the browser.
-   Never mark an order paid solely because the customer reached a
    success URL.
-   Verify payment server-side.
-   Validate payment reference, amount, currency and associated order.
-   Webhook processing should be idempotent so duplicate webhook events
    cannot duplicate payment effects.

## Future Payment Providers

Keep payment-specific code isolated so another provider can be added
later without redesigning orders.

Conceptually:

``` text
payments/
├── service
└── providers/
    └── paystack
```

Stripe and other providers are post-MVP.

------------------------------------------------------------------------

# 14. Order Confirmation

**Route example:** `/order/[reference]/success`

After confirmed payment, display:

-   Order reference
-   Confirmation message
-   Customer email
-   Purchased pieces
-   Amount paid
-   Delivery destination summary
-   Message explaining that Nankara will contact the customer for
    measurements
-   Contact/support link if already available on the existing site

Example:

> **Your Nankara piece is being prepared for your story.**\
> Your payment has been confirmed. Our team will contact you using the
> details provided to collect the measurements required to tailor your
> piece.

------------------------------------------------------------------------

# 15. Order Statuses

Use a small set relevant to Nankara's made-to-measure workflow:

``` text
PENDING_PAYMENT
PAID
IN_PRODUCTION
READY
SHIPPED
DELIVERED
CANCELLED
```

A separate payment failure does not necessarily need to become a
permanent order status; payment attempts can record their own status
while an unpaid order remains pending/expired according to backend
policy.

------------------------------------------------------------------------

# 16. Admin Authentication

**Route:** `/admin/login`

There is no existing authentication system, so MVP requires a small
admin-only authentication implementation.

Requirements:

-   Admin login
-   Secure password hashing
-   Protected admin routes
-   Protected admin API endpoints
-   Server-side authorization on every product/order mutation

Only one administrator is required initially, but the data model should
not make multiple admins impossible later.

Customer authentication is **not** part of MVP.

------------------------------------------------------------------------

# 17. Admin Dashboard

**Route:** `/admin`

Keep the dashboard intentionally small.

Navigation:

``` text
Overview
Products
Orders
Shipping
Logout
```

No analytics suite is required.

The overview can show simple operational counts such as:

-   Total products
-   New/paid orders
-   Orders in production
-   Orders awaiting shipment

------------------------------------------------------------------------

# 18. Admin --- Product Management

## Product List

**Route:** `/admin/products`

Show:

-   Product
-   Price
-   Category
-   Availability
-   Published state
-   Edit action

## Add Product

**Route:** `/admin/products/new`

Fields:

``` text
Name
Slug
Description
Price (NGN)
Category
Images
Availability
Published/Draft
```

`slug` may be automatically generated from the name and editable before
publishing.

Example:

``` text
Name: The Bold Statement Queen
Slug: the-bold-statement-queen
```

## Edit Product

**Route:** `/admin/products/[id]`

Admin can:

-   Edit product information
-   Change price
-   Add/remove/reorder images
-   Change category
-   Set In Stock / Out of Stock
-   Publish/unpublish product

Hard deletion is not required. Prefer unpublishing/archiving so
historical orders remain intact.

------------------------------------------------------------------------

# 19. Admin --- Orders

**Route:** `/admin/orders`

Order list shows at minimum:

-   Order reference
-   Customer name
-   Total
-   Payment state
-   Order status
-   Destination
-   Date

## Order Detail

**Route:** `/admin/orders/[id]`

Show:

### Customer

-   Name
-   Email
-   Phone/WhatsApp

### Delivery

-   Full address
-   Country
-   State/Region
-   Shipping zone
-   Shipping amount

### Items

-   Product
-   Quantity
-   Unit price
-   Subtotal

### Payment

-   Provider
-   Paystack reference
-   Amount
-   Payment status

### Fulfilment

Admin can change:

``` text
PAID
→ IN_PRODUCTION
→ READY
→ SHIPPED
→ DELIVERED
```

Because measurements are collected outside the website for MVP, the
admin/order workflow can later be extended with measurement records
without redesigning checkout.

------------------------------------------------------------------------

# 20. Suggested Data Model

The exact ORM implementation can vary, but the MVP needs approximately
the following entities.

## `admins`

``` text
id
email
password_hash
is_active
created_at
```

## `categories`

``` text
id
name
slug
```

## `products`

``` text
id
name
slug
description
price_ngn
category_id
availability
is_published
created_at
updated_at
```

## `product_images`

``` text
id
product_id
url
public_id
alt_text
sort_order
is_primary
```

## `orders`

``` text
id
reference
user_id              NULLABLE / reserved for future accounts

customer_first_name
customer_last_name
customer_email
customer_phone

delivery_country
delivery_address_1
delivery_address_2
delivery_city
delivery_state_region
delivery_postal_code
delivery_notes

shipping_zone_id
shipping_amount
subtotal
total
currency

status
created_at
updated_at
```

`user_id` is nullable so guest checkout works today and authenticated
customers can be attached later.

## `order_items`

``` text
id
order_id
product_id
product_name
product_slug
unit_price
quantity
subtotal
```

## `payments`

``` text
id
order_id
provider
provider_reference
amount
currency
status
created_at
verified_at
```

## `shipping_zones`

``` text
id
name
region_type
rate
currency
is_active
```

A separate customer/user table can be introduced when customer
authentication is built.

------------------------------------------------------------------------

# 21. Suggested FastAPI Structure

Keep the backend small.

``` text
app/
├── main.py
├── core/
│   ├── config.py
│   ├── database.py
│   └── security.py
├── auth/
├── products/
├── orders/
├── payments/
│   └── providers/
│       └── paystack.py
├── shipping/
└── admin/
```

Avoid introducing microservices for this MVP.

This should be one deployable FastAPI application.

------------------------------------------------------------------------

# 22. Minimum API Surface

Exact naming may change during implementation.

## Public Products

``` http
GET /api/v1/products
GET /api/v1/products/{slug}
GET /api/v1/categories
```

## Checkout / Orders

``` http
POST /api/v1/orders
GET  /api/v1/orders/{reference}/confirmation
```

The public confirmation endpoint must expose only safe information and
should use an unguessable access mechanism/reference if customer
authentication does not yet exist.

## Shipping

``` http
POST /api/v1/shipping/quote
```

Input: destination information.

Output: authoritative shipping quote.

## Payments

``` http
POST /api/v1/payments/paystack/initialize
POST /api/v1/payments/paystack/webhook
```

## Admin Auth

``` http
POST /api/v1/admin/auth/login
POST /api/v1/admin/auth/logout
```

## Admin Products

``` http
GET    /api/v1/admin/products
POST   /api/v1/admin/products
GET    /api/v1/admin/products/{id}
PATCH  /api/v1/admin/products/{id}
```

Image upload may be handled through the backend or securely through
signed/direct Cloudinary upload depending on implementation.

## Admin Orders

``` http
GET   /api/v1/admin/orders
GET   /api/v1/admin/orders/{id}
PATCH /api/v1/admin/orders/{id}/status
```

## Admin Shipping

``` http
GET   /api/v1/admin/shipping-zones
PATCH /api/v1/admin/shipping-zones/{id}
```

------------------------------------------------------------------------

# 23. Frontend Routes

``` text
Existing
/
 /about
 /contact
 ...

Commerce
/shop
/shop/[slug]
/cart
/checkout
/order/[reference]/success
/payment/failed

Admin
/admin/login
/admin
/admin/products
/admin/products/new
/admin/products/[id]
/admin/orders
/admin/orders/[id]
/admin/shipping
```

------------------------------------------------------------------------

# 24. Frontend vs Backend Responsibilities

## Next.js

Responsible for:

-   UI and brand presentation
-   Product browsing
-   Product gallery
-   Cart drawer
-   Cart page
-   Guest cart persistence
-   Checkout form
-   Displaying shipping quote returned by backend
-   Approximate USD display
-   Redirecting/opening payment flow
-   Payment result/confirmation UI
-   Admin UI

## FastAPI

Authoritative for:

-   Product data
-   Product prices
-   Availability
-   Categories
-   Admin authentication/authorization
-   Shipping calculation
-   Order totals
-   Order creation
-   Paystack initialization
-   Paystack verification/webhooks
-   Payment state
-   Order state
-   Admin mutations

**Rule:** The browser may display calculations, but FastAPI recalculates
and validates all money-related values before an order/payment is
accepted.

------------------------------------------------------------------------

# 25. Security Requirements for Launch

Even an MVP handling payments needs basic production safeguards.

Required:

-   HTTPS in production
-   Secrets only in environment/secret management
-   Secure admin password hashing
-   Protected admin endpoints
-   Input validation
-   Server-side price validation
-   Server-side shipping validation
-   Paystack webhook signature/transaction verification
-   Idempotent payment processing
-   No payment secret keys exposed to Next.js client code
-   Restricted CORS configuration
-   Database migrations
-   Basic request/error logging
-   Do not log payment secrets or unnecessary customer data

------------------------------------------------------------------------

# 26. SEO and Product URLs

Each product uses a human-readable slug:

``` text
/shop/the-bold-statement-queen
```

Each product page should have:

-   Unique page title
-   Meta description
-   Product/social sharing image
-   Canonical URL
-   Image alt text

Advanced SEO work can follow after launch, but these basics should be
present because they are inexpensive to implement now.

------------------------------------------------------------------------

# 27. Mobile Requirements

The shop must be designed mobile-first.

At minimum verify:

-   Product grid
-   Image gallery/swiping
-   Product text readability
-   Add to Bag
-   Cart drawer
-   Quantity controls
-   Checkout form
-   Country/state controls
-   Paystack flow
-   Admin usability on a normal laptop; full mobile admin optimization
    is not a launch blocker

------------------------------------------------------------------------

# 28. Error States That Must Exist

## Product

-   Out of stock
-   Product unavailable/unpublished
-   Failed image/API loading

## Cart

-   Product became unavailable
-   Product price changed
-   Invalid quantity

## Checkout

-   Invalid customer information
-   Shipping destination cannot be quoted
-   Product becomes unavailable before payment

## Payment

-   Payment cancelled
-   Payment failed
-   Payment pending
-   Payment succeeds but customer closes browser

The Paystack webhook must still be capable of marking the order paid
even when the customer never returns to the success page.

------------------------------------------------------------------------

# 29. Recommended Build Order

The milestones below are ordered so that a working end-to-end transaction
comes together early — but there is no schedule pressure, and each milestone
is finished completely before the next one starts. "Finished" means the
milestone's backend, its storefront, **and its admin UI** are all in place,
and its acceptance items pass through the real interface without developer
intervention (no `curl`, no Swagger, no seed script standing in for a screen
the spec calls for).

## Milestone 1 --- Data + Product Administration

-   PostgreSQL
-   FastAPI project
-   Database migrations
-   Admin authentication
-   Categories
-   Product CRUD
-   Product image upload
-   Admin product UI

**Done when:** admin can publish a real Nankara product without
developer intervention.

## Milestone 2 --- Storefront + Cart

-   Shop page connected to API
-   Product page
-   Gallery
-   Price display
-   Approximate USD display
-   Availability
-   Add to Bag
-   Cart drawer
-   Cart page

**Done when:** a visitor can browse the real catalogue and build a guest
cart.

## Milestone 3 --- Checkout + Shipping

-   Checkout form
-   Shipping zones
-   Dummy/configurable rates
-   Shipping quote endpoint
-   Server-side order calculation
-   Order creation

**Done when:** a valid cart can become a `PENDING_PAYMENT` order with a
server-calculated total.

## Milestone 4 --- Payment + Orders

-   Paystack initialization
-   Paystack webhook
-   Payment verification
-   Success/failure states
-   Admin order list
-   Admin order detail
-   Order status updates

**Done when:** a customer can pay and the verified paid order appears in
admin.

## Milestone 5 --- Launch Hardening

Only launch-critical work:

-   Production environment variables
-   HTTPS
-   Database backup strategy
-   Replace/approve dummy shipping rates
-   Paystack live credentials
-   Mobile QA
-   Checkout QA
-   Payment/webhook QA
-   Error handling
-   Basic logging
-   SEO metadata
-   Final product content/images

Then **go live**.

------------------------------------------------------------------------

# 30. MVP Acceptance Criteria

The Shop MVP is launch-ready when all of the following are true:

1.  Admin can log in securely.
2.  Admin can create, edit, publish and unpublish a product.
3.  Admin can upload several product images.
4.  A published product appears on `/shop`.
5.  Customer can open `/shop/[slug]`.
6.  Customer can see product information, price and availability.
7.  International presentation can show an approximate USD equivalent.
8.  Customer can add an available product to a guest cart.
9.  Cart persists through ordinary navigation/refresh.
10. Customer can update/remove cart items.
11. Customer can checkout without creating an account.
12. Customer can provide a Nigerian or international delivery address.
13. Backend determines the shipping fee from a configured shipping zone.
14. Backend independently recalculates product prices, shipping and
    total.
15. An order is created before payment.
16. Customer can pay through Paystack.
17. Successful payment is verified server-side.
18. Verified payment marks the correct order `PAID`.
19. Customer receives an on-site confirmation explaining that Nankara
    will contact them for measurements.
20. Admin can see the paid order and customer contact details.
21. Admin can move the order through production/shipping statuses.
22. Out-of-stock products cannot be purchased.
23. Payment and admin secrets are not exposed to the browser.
24. The complete customer purchase flow works on mobile.

Once **all** of these criteria genuinely pass — through the real UI, not a
workaround — the commerce MVP is complete and ready to launch. The post-MVP
features in §3 are separate work: they are not launch blockers and should not
be pulled forward, but launch should not happen before every criterion above
is actually met.

------------------------------------------------------------------------

# 31. Post-Launch Architecture Notes

The MVP should leave clean extension points for the following without
implementing them now.

## Customer Authentication

The existing guest order model keeps `user_id` nullable.

Later:

``` text
Guest Order
user_id = NULL

Authenticated Order
user_id = users.id
```

Orders do not need to be redesigned.

## Measurements

Measurements are collected manually after payment for MVP.

Later a measurement profile/system can attach to:

``` text
user
order
or order_item
```

without changing the basic product catalogue.

## Multiple Payment Providers

Keep Paystack implementation inside the payment layer so Stripe can
later implement the same application-level payment operations.

## Notifications

Order events can later trigger:

``` text
Order Paid
    ├── Email
    └── WhatsApp

Order Shipped
    ├── Email
    └── WhatsApp
```

without making notifications part of core payment logic.

## Shipping Integrations

The checkout should consume a shipping quote from the backend. Today
that quote comes from configured zones; later it can come from a
courier/logistics API without redesigning the checkout interface.

------------------------------------------------------------------------

# 32. Final MVP Principle

For launch, every feature should be tested against one question:

> **Does this feature help a customer discover a piece, pay for it, or
> help Nankara fulfil that paid order?**

If the answer is no, it probably belongs after launch.

The MVP's core is deliberately small:

``` text
PRODUCT
   ↓
CART
   ↓
CHECKOUT
   ↓
SHIPPING
   ↓
ORDER
   ↓
PAYSTACK
   ↓
PAID
   ↓
ADMIN
   ↓
CONTACT CUSTOMER FOR MEASUREMENTS
   ↓
PRODUCTION / DELIVERY
```

That is the first version worth shipping.
