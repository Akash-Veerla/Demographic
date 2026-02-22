# Server Documentation (Seeding & Data)

## User Seeding Script (`scripts/seed.js`)

The `seed.js` script is designed to rapidly populate your database with dummy users clustered around specific geographic locations. By default, this repository is configured to seed **200 users within Andhra Pradesh, India**.

### How to customize for your region

If you are cloning this repo and want to test the map logic in your own city or country, follow these steps:

1.  **Open `server/scripts/seed.js`**.
2.  **Define your Cities**: Find the `ANDHRA_PRADESH_CITIES` array (starting around line 100). Replace the city objects with your local cities and their Latitude/Longitude.
    *   Example: `{ name: "New York", lat: 40.7128, lng: -74.0060 }`
3.  **Localize Names**: Scroll up to the `MALE_NAMES` and `FEMALE_NAMES` arrays. Update these with common names from your region to make the experience feel authentic.
4.  **Adjust 'Jitter' (Spread)**: The `jitter` function (~line 200) adds a small random offset to coordinates so users aren't all standing on the exact same pin. You can increase the `range` if you want users spread across a larger province, or decrease it for a tight neighborhood view.
5.  **Change User Count**: Locate the `for` loop (around line 240). Change `i < 200` to whatever number of users you need.
6.  **Run the script**:
    ```bash
    # From the project root
    npm run seed
    ```

### Important Notes
*   **Database Wipe**: This script **DELETES** existing users and friend requests to ensure a clean state. Use with caution in environments where you have real user data.
*   **Schema Consistency**: The script automatically applies the latest schema rules, including `moderationStrikes: 0` and standard categories.
