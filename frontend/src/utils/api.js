const BASE_URL = "http://localhost:8000";

export const checkHealth = async () => {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
};

export const predictSepsis = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Prediction failed");

  return res.json();
};
