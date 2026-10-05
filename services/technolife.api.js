// -------------------------------------------------------------
//  Technolife Ingestion Service
//  - Fetches product pages from the Technolife API, maps them with
//    mapTechnolifeProduct, and upserts them via productService
//    (create-or-update, keyed on source+sourceId).
//  - Per-item errors never stop the whole sync — they're
//    collected into the summary report (see Phase 14 spec).
//
//  ⚠️ CONFIGURATION NEEDED: Technolife's real product-listing
//  endpoint, auth scheme (API key vs OAuth) and pagination
//  contract vary by account/API version and require Technolife
//  API documentation + your own registered credentials — none of
//  which were provided. TECHNOLIFE_API_URL / TECHNOLIFE_API_TOKEN
//  below are read from env so you only need to fill in real
//  values (and adjust `_fetchPage` below if the response shape
//  differs) without touching the pipeline logic.
// -------------------------------------------------------------

import axios from "axios";
import { mapTechnolifeProduct } from "../mappers/technolife.mapper.js";
import productService from "./product.service.js";
import logger from "../utils/logger.js";

class TechnolifeApiService {
  constructor() {
    this.baseURL = process.env.TECHNOLIFE_API_URL;
    this.token = process.env.TECHNOLIFE_API_TOKEN;
  }

  _assertConfigured() {
    if (!this.baseURL) {
      throw new Error(
        "TECHNOLIFE_API_URL تنظیم نشده است — این سرویس نیاز به آدرس واقعی API تکنولایف دارد",
      );
    }
  }

  /**
   * Fetches one page of raw products from Technolife.
   * ⚠️ Adjust the request shape/response parsing here once the
   * real Technolife endpoint contract is known.
   */
  async _fetchPage(page, pageSize) {
    const response = await axios.get(this.baseURL, {
      params: { page, per_page: pageSize },
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      timeout: 15000,
    });

    // Technolife commonly wraps list responses in a `data` array —
    // adjust this line if the real response shape differs.
    return Array.isArray(response.data?.data) ? response.data.data : [];
  }

  /**
   * Syncs products from Technolife into MongoDB.
   * @param {Object} options
   * @param {number} [options.maxPages=1] - how many pages to pull
   * @param {number} [options.pageSize=50]
   * @returns {Object} summary report: total/imported/updated/skipped/duplicated/invalid/errors
   */
  async syncProducts({ maxPages = 1, pageSize = 50 } = {}) {
    this._assertConfigured();

    const report = {
      total: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      duplicated: 0,
      invalid: 0,
      errors: [],
    };

    for (let page = 1; page <= maxPages; page++) {
      let rawProducts;
      try {
        rawProducts = await this._fetchPage(page, pageSize);
      } catch (err) {
        report.errors.push({ page, error: err.message });
        logger.error("Technolife: failed to fetch page", { page, error: err.message });
        break; // stop paging on a fetch failure, but keep whatever we already imported
      }

      if (rawProducts.length === 0) break; // no more pages

      for (const raw of rawProducts) {
        report.total += 1;
        try {
          const mapped = mapTechnolifeProduct(raw);

          if (!mapped.title || !mapped.price || !mapped.sourceId) {
            report.invalid += 1;
            report.errors.push({ sourceId: raw?.id ?? null, error: "داده ناقص محصول" });
            continue;
          }

          const { created } = await productService.upsertMappedProduct(mapped);
          if (created) report.imported += 1;
          else report.updated += 1;
        } catch (err) {
          report.invalid += 1;
          report.errors.push({ sourceId: raw?.id ?? null, error: err.message });
        }
      }
    }

    logger.info("Technolife sync finished", report);
    return report;
  }
}

export default new TechnolifeApiService();
