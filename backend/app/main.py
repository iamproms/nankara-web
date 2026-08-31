import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.admin.router import router as admin_router
from app.auth.router import router as auth_router
from app.categories.admin_router import router as admin_categories_router
from app.categories.router import router as categories_router
from app.core.config import settings
from app.media.router import router as media_router
from app.orders.admin_router import router as admin_orders_router
from app.orders.router import router as orders_router
from app.payments.router import router as payments_router
from app.products.admin_router import router as admin_products_router
from app.products.router import router as products_router
from app.shipping.admin_router import router as admin_shipping_router
from app.shipping.router import router as shipping_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Nankara Shop API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api/v1"

# Public storefront
app.include_router(products_router, prefix=f"{API_V1}/products", tags=["products"])
app.include_router(categories_router, prefix=f"{API_V1}/categories", tags=["categories"])
app.include_router(shipping_router, prefix=f"{API_V1}/shipping", tags=["shipping"])
app.include_router(orders_router, prefix=f"{API_V1}/orders", tags=["orders"])
app.include_router(payments_router, prefix=f"{API_V1}/payments", tags=["payments"])

# Admin
app.include_router(auth_router, prefix=f"{API_V1}/admin/auth", tags=["admin: auth"])
app.include_router(admin_router, prefix=f"{API_V1}/admin", tags=["admin: overview"])
app.include_router(
    admin_products_router, prefix=f"{API_V1}/admin/products", tags=["admin: products"]
)
app.include_router(
    admin_categories_router,
    prefix=f"{API_V1}/admin/categories",
    tags=["admin: categories"],
)
app.include_router(
    media_router, prefix=f"{API_V1}/admin/media", tags=["admin: media"]
)
app.include_router(
    admin_shipping_router,
    prefix=f"{API_V1}/admin/shipping-zones",
    tags=["admin: shipping"],
)
app.include_router(
    admin_orders_router, prefix=f"{API_V1}/admin/orders", tags=["admin: orders"]
)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
