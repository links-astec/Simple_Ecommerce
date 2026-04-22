# Bel's Haven 🖤✨
> A luxury e-commerce platform for fashion, beauty & accessories

---

## Quick Start

### 1. Backend (Django)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill in your environment variables
cp .env.example .env
# Edit .env with your keys (see below)

python manage.py migrate
python manage.py createsuperuser   # Create admin login
python manage.py runserver
```

Backend runs at: http://localhost:8000  
Admin panel: http://localhost:8000/admin

---

### 2. Frontend (React)

```bash
cd frontend
npm install

# Copy and fill in env
cp .env.example .env
# Edit .env with your keys

npm start
```

Frontend runs at: http://localhost:3000

---

## Environment Variables

### Backend `.env`

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key (generate a random one) |
| `DEBUG` | `True` for development, `False` for production |
| `EMAIL_HOST_USER` | Your Gmail address |
| `EMAIL_HOST_PASSWORD` | Gmail App Password (not your login password) |
| `ADMIN_EMAIL` | Where new order alerts are sent (her email) |
| `PAYSTACK_SECRET_KEY` | From https://dashboard.paystack.com |
| `PAYSTACK_PUBLIC_KEY` | From https://dashboard.paystack.com |
| `WHATSAPP_NUMBER` | e.g. `2348012345678` (no + sign) |
| `FRONTEND_URL` | e.g. `http://localhost:3000` or your live domain |

### Frontend `.env`

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend URL, e.g. `http://localhost:8000/api` |
| `REACT_APP_PAYSTACK_PUBLIC_KEY` | Same as backend public key |
| `REACT_APP_WHATSAPP_NUMBER` | Same as backend (e.g. `2348012345678`) |

---

## Gmail App Password Setup

1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Generate a password for "Mail"
4. Use that as `EMAIL_HOST_PASSWORD` — NOT your regular Gmail password

---

## Admin Usage (for Bel)

Go to **http://localhost:8000/admin** and log in.

### Adding Products
1. First create **Categories** (e.g. Fashion, Beauty, Accessories, Jewelry)
2. Add **Product Images** under the ProductImage section
3. Create **Products** — choose type:
   - **Available**: Set price, stock quantity, delivery timeframe, shipping fee
   - **Pre-order**: Set price, stock quantity, estimated arrival time, shipping fee (for when ready)

### Managing Orders
- View all orders under **Orders**
- Change order status (Pending → Paid → Processing → Shipped → Delivered)
- Mark preorder items as shipped using the `preorder_shipped` toggle on the product

### Marking Preorders as Ready to Ship
1. Go to the product in Admin
2. Tick `preorder_shipped = True`
3. Email customers manually with the shipping fee payment link (Paystack payment link can be generated)

---

## Features

- 🛍️ **Shop page** with filter by type (Available / Pre-order) and category
- 🔍 **Search** products
- 🛒 **Cart** with persistent localStorage
- 💳 **Paystack checkout** — redirects to Paystack, verifies on return
- 📧 **Auto email receipt** to customer after payment
- 📬 **Admin email alert** for every new order
- 📱 **WhatsApp validation link** in receipt email and order page
- 🏷️ **Pre-order system** — with ETA, stock limits, separate shipping fee on dispatch
- 📦 **Order tracking** page at `/order/:reference`
- ⚙️ **Django admin** — full store management for Bel

---

## Deployment Notes

For production:
- Set `DEBUG=False` in backend `.env`
- Set `ALLOWED_HOSTS=yourdomain.com`
- Use `gunicorn` to serve Django: `gunicorn bels_haven.wsgi`
- Build React: `npm run build` and serve with nginx
- Use PostgreSQL instead of SQLite for production database
- Use Paystack Live keys (not test keys)

---

Built with Django + React + Paystack 🖤
