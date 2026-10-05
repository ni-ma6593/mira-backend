// -------------------------------------------------------------
//  Price Intelligence Service
//  - Rule based (V1, no AI)
//  - Turns raw price data into structured, human-readable insight
//  - Works with `product.offers` (multiple stores) when available,
//    and gracefully falls back to the single `product.price` field
//    for products that don't have offers yet.
// -------------------------------------------------------------

class PriceIntelligenceService {
  /**
   * @param {Object} product - Product document/object. Uses `offers`
   *   ([{ store, price, url }]) when present, otherwise `price`.
   * @returns {Object} structured price intelligence
   */
  analyze(product) {
    const offers =
      Array.isArray(product.offers) && product.offers.length > 0
        ? product.offers
        : [{ store: product.source, price: product.price, url: product.url }];

    const prices = offers.map((o) => o.price).filter((p) => typeof p === "number");

    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const averagePrice = Number(
      (prices.reduce((sum, p) => sum + p, 0) / prices.length).toFixed(0),
    );

    const bestOffer = offers.find((o) => o.price === lowestPrice) || offers[0];
    const currentPrice = product.price;

    const priceDifference = Number((currentPrice - averagePrice).toFixed(0));

    return {
      lowestPrice,
      highestPrice,
      averagePrice,
      currentPrice,
      bestOffer: {
        store: bestOffer.store,
        price: bestOffer.price,
        url: bestOffer.url,
      },
      priceDifference,
      insight: this._buildInsight({
        currentPrice,
        averagePrice,
        lowestPrice,
        highestPrice,
        offerCount: offers.length,
      }),
    };
  }

  _buildInsight({ currentPrice, averagePrice, lowestPrice, highestPrice, offerCount }) {
    if (offerCount <= 1) {
      return "در حال حاضر فقط یک قیمت برای این محصول ثبت شده است.";
    }

    if (currentPrice <= lowestPrice) {
      return "این قیمت، پایین‌ترین قیمت موجود در بین فروشگاه‌هاست.";
    }

    if (currentPrice < averagePrice) {
      return "قیمت فعلی پایین‌تر از میانگین قیمت بازار است.";
    }

    if (currentPrice > averagePrice) {
      return "قیمت فعلی بالاتر از میانگین قیمت بازار است.";
    }

    return "قیمت فعلی برابر با میانگین قیمت بازار است.";
  }
}

export default new PriceIntelligenceService();
