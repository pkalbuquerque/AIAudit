# Payment Security (Stripe)

## Never Trust Client-Submitted Prices

The #1 payment vulnerability: the price comes from the client. An attacker can set any amount, including $0.

```typescript
// BAD: price comes from the request body
const session = await stripe.checkout.sessions.create({
  line_items: [{
    price_data: {
      unit_amount: req.body.price, // attacker controls this
    },
  }],
});

// GOOD: look up the price server-side
const product = await db.products.findUnique({ where: { id: req.body.productId } });
const session = await stripe.checkout.sessions.create({
  line_items: [{ price: product.stripePriceId, quantity: 1 }],
});
```

## Webhook Signature Verification

Stripe webhooks must have their signatures verified using the **raw request body** — parsing as JSON first destroys the signature.

```typescript
// Express: webhook route MUST use express.raw() BEFORE express.json()
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
});

// Next.js App Router: use request.text(), NOT request.json()
const body = await request.text();
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
```

## Subscription Status Validation

Check subscription status **server-side on every protected request** using your database. Do not rely on:
- A cached session value from login time
- A client-side flag
- A JWT claim set at token creation

Subscriptions change via webhooks — your database is the source of truth.

## Checkout Session Metadata

Validate that checkout session metadata (user ID, plan, etc.) was set **server-side** when creating the session, not passed from the client.
