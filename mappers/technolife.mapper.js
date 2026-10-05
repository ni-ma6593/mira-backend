export const mapTechnolifeProduct = (raw) => {
  return {
    title: raw.productName || "",
    brand: raw.brand || "",
    category: raw.category || "",
    price: raw.minPrice || 0,
    image: raw.imageUrl || "",
    specs: raw.specs || {},
    source: "technolife",
    sourceId: raw.id || "",
    url: raw.url || "",
    affiliate: {
      technolife: raw.affiliateUrl || ""
    },
    searchableText: `${raw.productName || ""} ${raw.brand || ""} ${raw.category || ""}`
  };
};
