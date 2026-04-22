from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.utils.text import slugify
from store.models import Category, Product, ProductImage
import requests
import random
import uuid


class Command(BaseCommand):
    help = "Seed DB with products + downloaded images"

    def handle(self, *args, **kwargs):
        self.stdout.write("🌿 Seeding Bel's Haven with real images...")

        # ── Categories ─────────────────────────────
        categories_data = [
            {"name": "Fashion", "slug": "fashion"},
            {"name": "Footwear", "slug": "footwear"},
            {"name": "Bags", "slug": "bags"},
            {"name": "Skincare", "slug": "skincare"},
            {"name": "Student", "slug": "student"},
            {"name": "Home", "slug": "home"},
        ]

        categories = {}
        for c in categories_data:
            cat, _ = Category.objects.get_or_create(
                slug=c["slug"],
                defaults={"name": c["name"]}
            )
            categories[c["slug"]] = cat

        # ── Product templates ──────────────────────
        products_pool = [
            # FOOTWEAR
            ("Running Sneakers", "footwear", "https://images.unsplash.com/photo-1542291026-7eec264c27ff"),
            ("Canvas Shoes", "footwear", "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77"),
            ("Leather Shoes", "footwear", "https://images.unsplash.com/photo-1614252369475-531eba835eb1"),
            ("Slides Slippers", "footwear", "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a"),
            ("Boots", "footwear", "https://images.unsplash.com/photo-1608256246200-53e635b5b65f"),

            # FASHION
            ("Plain T-Shirt", "fashion", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"),
            ("Hoodie", "fashion", "https://images.unsplash.com/photo-1556821840-3a63f95609a7"),
            ("Denim Jeans", "fashion", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246"),
            ("Summer Dress", "fashion", "https://images.unsplash.com/photo-1496747611176-843222e1e57c"),
            ("Jacket", "fashion", "https://images.unsplash.com/photo-1520975954732-35dd22299614"),

            # BAGS
            ("Backpack", "bags", "https://images.unsplash.com/photo-1509762774605-f07235a08f1f"),
            ("Laptop Bag", "bags", "https://images.unsplash.com/photo-1515879218367-8466d910aaa4"),
            ("Handbag", "bags", "https://images.unsplash.com/photo-1584917865442-de89df76afd3"),
            ("Travel Duffel", "bags", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62"),

            # SKINCARE
            ("Face Cleanser", "skincare", "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc"),
            ("Body Lotion", "skincare", "https://images.unsplash.com/photo-1585386959984-a4155224a1ad"),
            ("Face Serum", "skincare", "https://images.unsplash.com/photo-1612817288484-6f916006741a"),
            ("Sunscreen", "skincare", "https://images.unsplash.com/photo-1596462502278-27bfdc403348"),

            # STUDENT
            ("Notebook", "student", "https://images.unsplash.com/photo-1519681393784-d120267933ba"),
            ("Desk Lamp", "student", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c"),
            ("Study Chair", "student", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7"),

            # HOME
            ("Laundry Basket", "home", "https://images.unsplash.com/photo-1598300056393-4aac492f4344"),
            ("Bedside Lamp", "home", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c"),
            ("Wall Clock", "home", "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c"),
            ("Storage Box", "home", "https://images.unsplash.com/photo-1581578731548-c64695cc6952"),
        ]

        # ── Helper: download image ─────────────────
        def download_image(url):
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    return ContentFile(response.content)
            except Exception:
                return None

        created = 0

        # ── Generate 100+ products ────────────────
        for i in range(1, 121):  # 120 products
            name, cat_slug, img_url = random.choice(products_pool)

            product_name = f"{name} {i}"
            slug = slugify(product_name)

            if Product.objects.filter(slug=slug).exists():
                continue

            is_preorder = random.choice([True, False])

            stock_quantity = random.randint(5, 60) if not is_preorder else random.randint(10, 100)

            product = Product.objects.create(
                name=product_name,
                slug=slug,
                description=f"{name} crafted for comfort, durability, and style.",
                category=categories[cat_slug],
                price=random.randint(80, 900),
                shipping_fee=random.randint(10, 40),
                product_type="preorder" if is_preorder else "available",

                # ✅ NEVER zero
                stock_quantity=stock_quantity,

                delivery_timeframe="" if is_preorder else "2–5 business days",
                preorder_eta="3–6 weeks" if is_preorder else "",
                preorder_shipping_fee=20 if is_preorder else 0,

                status="active",
                is_featured=random.choice([True, False]),
            )
            # ── Download + attach image ───────────
            img_file = download_image(img_url)

            if img_file:
                filename = f"{uuid.uuid4()}.jpg"

                image = ProductImage.objects.create(
                    alt_text=product_name,
                    is_primary=True
                )

                image.image.save(filename, img_file, save=True)
                product.images.add(image)

            created += 1
            self.stdout.write(f"✓ {product.name}")

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Done! {created} products created with real images."
        ))