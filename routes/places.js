const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Endpoint untuk mencari tempat sekaligus mendapatkan detail (termasuk nomor telepon dan website)
router.get("/search", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&key=${API_KEY}`;

  try {
    // Pencarian awal menggunakan Text Search API
    const response = await axios.get(textSearchUrl);
    const data = response.data;

    if (data.status !== "OK") {
      return res
        .status(404)
        .json({ error: data.error_message || "Failed to fetch data" });
    }

    // Ambil daftar tempat dari hasil pencarian
    const places = data.results;

    // Lakukan permintaan untuk mendapatkan detail tambahan dari setiap tempat
    const detailedPlaces = await Promise.all(
      places.map(async (place) => {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,international_phone_number,formatted_address,website,rating,user_ratings_total,types&key=${API_KEY}`;

        try {
          const detailsResponse = await axios.get(detailsUrl);
          const detailsData = detailsResponse.data;

          if (detailsData.status === "OK") {
            const detail = detailsData.result;
            return {
              title: detail.name,
              totalScore: detail.rating || "N/A",
              reviewsCount: detail.user_ratings_total || 0,
              street: detail.formatted_address,
              website: detail.website || "N/A",
              phone: detail.international_phone_number || "N/A",
              categoryName: detail.types ? detail.types : "N/A",
            };
          }
        } catch (error) {
          console.error(
            `Failed to fetch details for placeId ${place.place_id}:`,
            error.message
          );
        }

        // Kembalikan data minimal jika detail gagal
        return {
          title: place.name,
          totalScore: place.rating || "N/A",
          reviewsCount: place.user_ratings_total || 0,
          street: place.formatted_address,
          website: "N/A",
          phone: "N/A",
          categoryName: place.types ? place.types[0] : "N/A",
        };
      })
    );

    res.json(detailedPlaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/bulk-search", async (req, res) => {
  const { queries } = req.body;

  if (!queries || !Array.isArray(queries)) {
    return res
      .status(400)
      .json({ error: "Queries parameter is required and must be an array" });
  }

  try {
    // Proses setiap query secara paralel
    const allPlaces = [];

    await Promise.all(
      queries.map(async (query) => {
        if (!query) {
          return;
        }

        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          query
        )}&key=${API_KEY}`;

        try {
          // Pencarian awal menggunakan Text Search API
          const response = await axios.get(textSearchUrl);
          const data = response.data;

          if (data.status === "OK") {
            const places = data.results;

            // Dapatkan detail tambahan untuk setiap tempat
            const detailedPlaces = await Promise.all(
              places.map(async (place) => {
                const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,international_phone_number,formatted_address,website,rating,user_ratings_total,types&key=${API_KEY}`;

                try {
                  const detailsResponse = await axios.get(detailsUrl);
                  const detailsData = detailsResponse.data;

                  if (detailsData.status === "OK") {
                    const detail = detailsData.result;
                    return {
                      title: detail.name,
                      totalScore: detail.rating || "N/A",
                      reviewsCount: detail.user_ratings_total || 0,
                      street: detail.formatted_address,
                      website: detail.website || "N/A",
                      phone: detail.international_phone_number || "N/A",
                      categoryName: detail.types ? detail.types : "N/A",
                    };
                  }
                } catch (error) {
                  console.error(
                    `Failed to fetch details for placeId ${place.place_id}:`,
                    error.message
                  );
                }

                // Data minimal jika gagal mendapatkan detail
                return {
                  title: place.name,
                  totalScore: place.rating || "N/A",
                  reviewsCount: place.user_ratings_total || 0,
                  street: place.formatted_address,
                  website: "N/A",
                  phone: "N/A",
                  categoryName: place.types ? place.types[0] : "N/A",
                };
              })
            );

            // Tambahkan hasil ke array utama
            allPlaces.push(...detailedPlaces);
          }
        } catch (error) {
          console.error(
            `Error fetching data for query "${query}":`,
            error.message
          );
        }
      })
    );

    res.json(allPlaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
