// -------------------------------------------------------------
//  SMS Service (Production-Ready) — Kavenegar
//  - OTP via Kavenegar's Verify/Lookup API (pattern/template
//    based — Kavenegar's recommended method for OTP, better
//    deliverability than a plain SMS with the code inside)
//  - Welcome message via Kavenegar's plain Send API
//  - Unified error handling with AppError
//  - Never logs the OTP code itself (see auth.controller.js)
// -------------------------------------------------------------

import axios from "axios";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

class SMSService {
  constructor() {
    this.apiKey = process.env.KAVENEGAR_API_KEY;
    this.sender = process.env.KAVENEGAR_SENDER;
    this.otpTemplate = process.env.KAVENEGAR_OTP_TEMPLATE;
    this.baseURL = "https://api.kavenegar.com/v1";
  }

  _assertConfigured() {
    if (!this.apiKey) {
      throw new AppError(
        "سرویس پیامک پیکربندی نشده است",
        500,
        "SMS_NOT_CONFIGURED",
      );
    }
  }

  // -------------------------------------------------------------
  //  Send OTP via Kavenegar's Verify/Lookup endpoint.
  //  Docs: https://kavenegar.com/rest.html#lookup
  //  The template must exist in the Kavenegar panel with a single
  //  %token%-style placeholder for the code.
  // -------------------------------------------------------------
  async sendOTP(phone, code) {
    if (!phone || !code) {
      throw new AppError(
        "شماره موبایل یا کد تایید ارسال نشده است",
        400,
        "OTP_DATA_MISSING",
      );
    }
    this._assertConfigured();
    if (!this.otpTemplate) {
      console.log(this.otpTemplate);

      throw new AppError(
        "قالب پیامک OTP پیکربندی نشده است",
        500,
        "SMS_TEMPLATE_NOT_CONFIGURED",
      );
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/${this.apiKey}/verify/lookup.json`,
        {
          params: {
            receptor: phone,
            token: code,
            template: this.otpTemplate,
          },
          timeout: 10000,
        },
      );

      const { return: ret } = response.data || {};

      // Kavenegar success status is 200
      if (ret?.status === 200) return response.data;

      throw new AppError(
        ret?.message || "خطای نامشخص پیامک",
        502,
        "SMS_PROVIDER_ERROR",
      );
    } catch (err) {
      if (err instanceof AppError) throw err;

      logger.error("Kavenegar OTP send failed", {
        error: err.message,
        // Never log the code or full phone number in error context
      });

      throw new AppError(
        "ارتباط با سرویس پیامک برقرار نشد",
        502,
        "SMS_PROVIDER_CONNECTION_ERROR",
      );
    }
  }

  // -------------------------------------------------------------
  //  Send Welcome Message via Kavenegar's plain Send endpoint.
  //  Docs: https://kavenegar.com/rest.html#sms-send
  //  Best-effort: never blocks or fails registration.
  // -------------------------------------------------------------
  async sendWelcomeMessage(phone) {
    if (!phone) {
      throw new AppError("شماره موبایل ارسال نشده است", 400, "PHONE_REQUIRED");
    }
    if (!this.apiKey) return; // best-effort, don't block signup if unconfigured

    try {
      await axios.get(`${this.baseURL}/${this.apiKey}/sms/send.json`, {
        params: {
          receptor: phone,
          sender: this.sender,
          message: "به میرا خوش آمدید 🌟",
        },
        timeout: 10000,
      });
    } catch (err) {
      logger.warn("Kavenegar welcome message failed (non-blocking)", {
        error: err.message,
      });
      return; // نباید ثبت‌نام را خراب کند
    }
  }
}

export default new SMSService();
