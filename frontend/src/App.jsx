
import React, { useEffect, useState } from "react";
import "./App.css";

function formatNumber(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "—";
  }

  return Number(value).toLocaleString("en-IN");
}

function formatPrice(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "—";
  }

  return Number(value).toFixed(2);
}
function calculateVolumePercentage(volume, maximumVolume) {
  const currentVolume = Number(volume);

  if (
    volume == null ||
    !Number.isFinite(currentVolume) ||
    maximumVolume <= 0
  ) {
    return null;
  }

  return ((currentVolume / maximumVolume) * 100).toFixed(2);
}
function App() {
  const [options, setOptions] = useState([]);
  const [spotPrice, setSpotPrice] = useState(null);
  const [status, setStatus] = useState("Connecting...");
  const [error, setError] = useState("");
  const [fetchedAt, setFetchedAt] = useState("");

  const highestCallVolume = Math.max(
    ...options.map((option) => Number(option.callVolume) || 0)
  );

  const highestPutVolume = Math.max(
    ...options.map((option) => Number(option.putVolume) || 0)
  );

  useEffect(() => {
    async function fetchOptions() {
      try {
        setStatus("Fetching NIFTY data...");
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/options"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to fetch option-chain data"
          );
        }

        setOptions(result.options ?? []);
        setSpotPrice(result.spotPrice ?? null);
        setFetchedAt(result.fetchedAt ?? "");
        setStatus("Connected to Upstox");
      } catch (err) {
        setError(err.message);
        setStatus("Connection failed");
      }
    }

    fetchOptions();

    const intervalId = setInterval(fetchOptions, 10000);

    return () => clearInterval(intervalId);
  }, []);
  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <h1>NIFTY Options Dashboard</h1>
          <p>Live option-chain data from Upstox</p>
        </div>

        <span className="status">{status}</span>
      </header>

      <section className="market-info">
        <div>
          <span className="info-label">INDEX</span>
          <h2>NIFTY 50</h2>
        </div>

        <div>
          <span className="info-label">EXPIRY</span>
          <h2>{options[0]?.expiry ?? "—"}</h2>
        </div>

        <div>
          <span className="info-label">STRIKES</span>
          <h2>{options.length}</h2>
        </div>

        <div>
          <span className="info-label">LAST FETCHED</span>
          <h2>
            {fetchedAt
              ? new Date(fetchedAt).toLocaleTimeString("en-IN")
              : "—"}
          </h2>
        </div>
      </section>

      {error && <p className="error">{error}</p>}


      <section className="table-section">
        <h2>NIFTY Option Chain</h2>
        <p className="note">
          Upstox market data · Snapshot refreshes every 10 seconds
        </p>

        <div className="table-wrapper">
          <table>

            <thead>
              <tr>
                <th colSpan="3" className="call-heading">CALL OPTIONS</th>
                <th className="strike-heading">STRIKE PRICE</th>
                <th colSpan="3" className="put-heading">PUT OPTIONS</th>
              </tr>
              <tr>
                <th>OI</th>
                <th>VOLUME</th>
                <th>LTP (₹)</th>
                <th>STRIKE PRICE</th>
                <th>LTP (₹)</th>
                <th>VOLUME</th>
                <th>OI</th>
              </tr>
            </thead>


            <tbody>
              {options.map((option, index) => {
                const nextOption = options[index + 1];

                const showSpotLine =
                  spotPrice !== null &&
                  nextOption &&
                  spotPrice >= option.strikePrice &&
                  spotPrice < nextOption.strikePrice;

                return (
                  <React.Fragment key={option.strikePrice}>
                    <tr>

                      <td>{formatNumber(option.callOi)}</td>

                      {/* Call Volume: highlight the highest volume */}

                      <td
                        className={
                          Number(option.callVolume) === highestCallVolume &&
                            highestCallVolume > 0
                            ? "highest-volume"
                            : ""
                        }
                      >
                        <div className="volume-value">
                          {formatNumber(option.callVolume)}
                        </div>
                        <div className="volume-percentage">
                          {calculateVolumePercentage(
                            option.callVolume,
                            highestCallVolume
                          ) !== null
                            ? `${calculateVolumePercentage(
                              option.callVolume,
                              highestCallVolume
                            )}%`
                            : "—"}
                        </div>
                      </td>


                      {/* Call LTP */}
                      <td className="call-ltp">
                        {formatPrice(option.callLtp)}
                      </td>

                      {/* Strike Price */}
                      <td className="strike">
                        {formatNumber(option.strikePrice)}
                      </td>

                      {/* Put LTP */}
                      <td className="put-ltp">
                        {formatPrice(option.putLtp)}
                      </td>

                      {/* Put Volume: highlight the highest volume */}

                      <td
                        className={
                          Number(option.putVolume) === highestPutVolume &&
                            highestPutVolume > 0
                            ? "highest-volume"
                            : ""
                        }
                      >
                        <div className="volume-value">
                          {formatNumber(option.putVolume)}
                        </div>
                        <div className="volume-percentage">
                          {calculateVolumePercentage(
                            option.putVolume,
                            highestPutVolume
                          ) !== null
                            ? `${calculateVolumePercentage(
                              option.putVolume,
                              highestPutVolume
                            )}%`
                            : "—"}
                        </div>
                      </td>


                      {/* Put OI */}
                      <td>{formatNumber(option.putOi)}</td>

                    </tr>

                    {showSpotLine && (
                      <tr className="spot-row">
                        <td colSpan="3"></td>
                        <td className="spot-cell">
                          <span>SPOT</span>
                          <strong>{formatPrice(spotPrice)}</strong>
                        </td>
                        <td colSpan="3"></td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>


          </table>

          {options.length === 0 && (
            <p className="empty">No option-chain data available.</p>
          )}
        </div>
      </section>


      <footer>React · Node.js · Express · Upstox API</footer>
    </main>
  );
}

export default App;
