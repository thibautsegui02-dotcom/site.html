import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Mappe les IDs du panier -> Stripe Price IDs
const CATALOG = {
	head_spa: { priceId: "price_1TTjJSFTxipvHp0RQmDO4OrV" },
	drainage_corps: { priceId: "price_1TTdq4FTxipvHp0Rg3uB7dXd" },
};

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Méthode non autorisée" });
	}

	try {
		const items = Array.isArray(req.body?.items) ? req.body.items : [];
		if (!items.length) return res.status(400).json({ error: "Panier vide" });

		const line_items = items.map((it) => {
			const entry = CATALOG[it.id];
			if (!entry) throw new Error("Produit inconnu: " + it.id);

			const qty = Math.max(1, Math.min(10, Number(it.qty || 1)));
			return { price: entry.priceId, quantity: qty };
		});

		const origin =
			req.headers.origin ||
			`https://${req.headers["x-forwarded-host"] || req.headers.host}`;

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			line_items,
			success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/prestations.html`,
		});

		return res.status(200).json({ url: session.url });
	} catch (e) {
		return res.status(500).json({ error: e.message || "Erreur" });
	}
}
