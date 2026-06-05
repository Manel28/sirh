import axios from "axios";

const API_URL = "http://127.0.0.1:8001/api/login";

export const loginUser = async (credentials) => {
  console.log("LOGIN URL =", API_URL);
  console.log("LOGIN DATA =", credentials);

  const response = await axios.post(API_URL, credentials, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
};