import { useState } from "react";
import { predictSepsis } from "../utils/api";

export default function FileUpload({ onResult }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    setLoading(true);
    setError("");

    try {
      const data = await predictSepsis(file);
      onResult(data);
    } catch (err) {
      setError("Network Error - backend not connected");
    }

    setLoading(false);
  };

  return (
    <div className="upload-box">
      <input
        type="file"
        accept=".csv,.psv"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {loading && <p>Processing...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}