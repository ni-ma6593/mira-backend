export const mapBasalamProduct = (raw) => {
  return {
    title: raw.title || "",
    brand: raw.brand || "",
    category: raw.category || "",
    price: raw.price || 0,
    image: raw.image || "",
    specs: raw.specs || {},
    source: "basalam",
    sourceId: raw.id || "",
    url: raw.url || "",
    affiliate: {
      basalam: raw.affiliateUrl || ""
    },
    searchableText: `${raw.title || ""} ${raw.brand || ""} ${raw.category || ""}`
  };
};
