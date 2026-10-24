
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Options Dashboard API is running",
  });
});

app.get("/api/options", async (req, res) => {
  try {
    const token = process.env.UPSTOX_ACCESS_TOKEN;

    if (!token) {
      return res.status(500).json({
        success: false,
        message: "Missing Upstox token in backend/.env",
      });
    }

    const instrumentKey = "NSE_INDEX|Nifty 50";
    const expiryDate = req.query.expiry || "current_month";

    const url = new URL(
      "https://api.upstox.com/v2/option/chain"
    );

    url.searchParams.set("instrument_key", instrumentKey);
    url.searchParams.set("expiry_date", expiryDate);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Upstox request failed:", response.status);

      return res.status(response.status).json({
        success: false,
        message: "Upstox option-chain request failed",
        details: result,
      });
    }

    return res.json({
  success: true,
  source: "Upstox",
  fetchedAt: new Date().toISOString(),
  index: "NIFTY",
  spotPrice: result.data?.[0]?.underlying_spot_price ?? null,
  options: result.data.map((item) => ({
    strikePrice: item.strike_price,
    callLtp: item.call_options?.market_data?.ltp ?? null,
    callOi: item.call_options?.market_data?.oi ?? null,
    callVolume: item.call_options?.market_data?.volume ?? null,
    putLtp: item.put_options?.market_data?.ltp ?? null,
    putOi: item.put_options?.market_data?.oi ?? null,
    putVolume: item.put_options?.market_data?.volume ?? null,
    pcr: item.pcr,
    expiry: item.expiry,
  })),
});
  }catch (error) {
  console.error("Request error:", error);
  console.error("Cause:", error.cause);

  return res.status(500).json({
    success: false,
    message: "Could not retrieve option-chain data",
    error: error.message,
    cause: error.cause?.code || null,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
