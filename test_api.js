// test_api.js
const axios = require("axios");
const { console } = require("inspector");

const BASE = process.env.BASE_URL || "http://localhost:5000/api";
const ORG = {
  name: "Organizer",
  email: "alice@org.com",
  password: "pass123",
  role: "organizer",
};
const VND = {
  name: "Vendor",
  email: "bob@vendor.com",
  password: "pass123",
  role: "vendor",
  vendorProfile: { serviceType: "decorator", bio: "Test vendor" },
};

async function go() {
  try {
    console.log("=== 1) Test Registration ===");

    // Organizer register
    try {
      let r = await axios.post(`${BASE}/auth/register`, ORG);
      console.log(" Organizer registered:", r.data.user.email);
    } catch (e) {
      if (e.response?.status === 409) {
        console.log(" Organizer already registered");
      } else throw e;
    }

    // Vendor register
    try {
      let r = await axios.post(`${BASE}/auth/register`, VND);
      console.log(" Vendor registered:", r.data.user.email);
    } catch (e) {
      if (e.response?.status === 409) {
        console.log(" Vendor already registered");
      } else throw e;
    }

    console.log("\n=== 2) Login Organizer & Vendor ===");
    // Organizer login
    let res = await axios.post(`${BASE}/auth/login`, {
      email: ORG.email,
      password: ORG.password,
    });
    const orgToken = res.data.token;
    const orgId = res.data.user.id; // <— store this

    console.log(" Organizer token:", orgToken.slice(0, 10) + "…");

    // Vendor login
    res = await axios.post(`${BASE}/auth/login`, {
      email: VND.email,
      password: VND.password,
    });
    const vndToken = res.data.token;
    const vndId = res.data.user.id; // <— and this

    console.log(" Vendor token:", vndToken.slice(0, 10) + "…");

    console.log("\n=== 3) GET /auth/me ===");
    res = await axios.get(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    console.log(res.data);

    console.log("\n=== 4) Event Flow ===");
    // Create
    res = await axios.post(
      `${BASE}/events`,
      {
        title: "Test Event",
        date: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        venue: "Hall A",
      },
      { headers: { Authorization: `Bearer ${orgToken}` } }
    );
    const eventId = res.data._id;
    console.log(" Created event:", eventId);

    // List
    res = await axios.get(`${BASE}/events`, {
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    console.log(" My events count:", res.data.length);

    // Add guest
    res = await axios.post(
      `${BASE}/events/${eventId}/guests`,
      {
        name: "Jane Doe",
        email: "jane@example.com",
      },
      { headers: { Authorization: `Bearer ${orgToken}` } }
    );
    const guest = res.data.guests.slice(-1)[0];
    console.log(" Added guest:", guest._id);

    // RSVP
    res = await axios.put(
      `${BASE}/events/${eventId}/guests/${guest._id}`,
      {
        status: "yes",
      },
      { headers: { Authorization: `Bearer ${orgToken}` } }
    );
    console.log(
      " Updated guest status:",
      res.data.guests.find((g) => g._id === guest._id).status
    );

    console.log("\n=== 5) Vendor Geo & Listing ===");
    // Update location
    console.log("vendorid", vndId, "vendortoken", vndToken);
    await axios.put(
      `${BASE}/vendors/${vndId}/location`,
      {
        lat: 31.7683,
        lng: 35.2137,
      },
      { headers: { Authorization: `Bearer ${vndToken}` } }
    );
    console.log(" Updated vendor location");

    // List nearby
    res = await axios.get(`${BASE}/vendors`, {
      headers: { Authorization: `Bearer ${orgToken}` },
      params: { lat: 31.7683, lng: 35.2137, radius: 5 },
    });
    console.log(" Vendors found:", res.data.length);

    console.log("\n=== 6) Offerings CRUD ===");
    // Create
    res = await axios.post(
      `${BASE}/vendors/${res.data[0]._id}/offerings`,
      {
        title: "Test Item",
        description: "Demo",
        images: [],
        price: 100,
      },
      { headers: { Authorization: `Bearer ${vndToken}` } }
    );
    const offerId = res.data._id;
    console.log(" Offering created:", offerId);

    // List
    res = await axios.get(`${BASE}/vendors/${res.data.vendor}/offerings`, {
      headers: { Authorization: `Bearer ${vndToken}` },
    });
    console.log(" Offerings count:", res.data.length);
    console.log("res,data", res.data);
    // Update
    res = await axios.put(
      `${BASE}/vendors/682bac57621673afe73b7d0d/offerings/${offerId}`,
      {
        price: 120,
      },
      { headers: { Authorization: `Bearer ${vndToken}` } }
    );
    console.log(" Offering updated price:", res.data.price);

    // Delete
    await axios.delete(
      `${BASE}/vendors/${res.data.vendor}/offerings/${offerId}`,
      {
        headers: { Authorization: `Bearer ${vndToken}` },
      }
    );
    console.log(" Offering deleted");

    console.log("\n=== 7) Bookings ===");
    // Re-create offering for booking
    res = await axios.post(
      `${BASE}/vendors/${res.data.vendor}/offerings`,
      {
        title: "Booking Item",
        description: "For booking",
        images: [],
        price: 200,
      },
      { headers: { Authorization: `Bearer ${vndToken}` } }
    );
    const offForBook = res.data._id;

    // Book
    res = await axios.post(
      `${BASE}/bookings`,
      {
        event: eventId,
        offering: offForBook,
        quantity: 2,
      },
      { headers: { Authorization: `Bearer ${orgToken}` } }
    );
    const bookingId = res.data._id;
    console.log(" Booking created:", bookingId);

    // Vendor confirm
    res = await axios.put(
      `${BASE}/bookings/${bookingId}/status`,
      {
        status: "confirmed",
      },
      { headers: { Authorization: `Bearer ${vndToken}` } }
    );
    console.log(" Booking status:", res.data.status);

    console.log("\n=== 8) Vendor Sales History ===");
    res = await axios.get(
      `${BASE}/vendors/${res.data.offering.vendor}/bookings`,
      {
        headers: { Authorization: `Bearer ${vndToken}` },
      }
    );
    console.log(" Sales records:", res.data.length);

    console.log("\n=== 9) Notifications (FCM) ===");
    res = await axios.post(
      `${BASE}/notifications/token`,
      { token: "abc123" },
      {
        headers: { Authorization: `Bearer ${orgToken}` },
      }
    );
    console.log(res.data);
    res = await axios.delete(`${BASE}/notifications/token`, {
      headers: { Authorization: `Bearer ${orgToken}` },
      data: { token: "abc123" },
    });
    console.log(res.data);

    console.log("\n✅ All tests passed!");
  } catch (e) {
    console.error("❌ Test failed:", e.response?.data || e.message);
    process.exit(1);
  }
}

go();
