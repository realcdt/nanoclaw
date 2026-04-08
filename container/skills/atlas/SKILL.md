# Atlas Platform Integration

Query the Atlas real estate platform API for users, listings, exclusive listings, appointments, and listing inquiries.

## Authentication

A system JWT token is available in the `ATLAS_API_TOKEN` environment variable. Use it as a Bearer token:

```bash
curl -s -H "Authorization: Bearer $ATLAS_API_TOKEN" "$ATLAS_API_URL/<endpoint>"
```

This token has admin privileges and does not expire soon. No JWT generation needed.

## Base URL

`$ATLAS_API_URL` (set in environment, currently https://api.atlascdt.com)

## Endpoints

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /users | Admin | List all users with Supabase metadata |
| GET | /users/{user_id} | Any | Get user by ID |
| GET | /users/me | Any | Get current authenticated user |

**User fields:** id, email, display_name, first_name, last_name, mobile_phone, client_type (BUYER/SELLER/RENTER/LANDLORD/ATLASCDT), role_type (AGENT/CLIENT/ADMIN), permissions, assigned_agent, exclusive_listing_ids, is_active, city, state

### MLS Listings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /listings | Any | Search listings with filters |
| GET | /listings/{id} | Any | Get listing by ID |
| POST | /listings/search-by-address | Any | Search by address string |
| POST | /listings/autocomplete | Any | Address autocomplete |

**Search parameters** (GET /listings):
- `neighborhood` — filter by neighborhood(s), can pass multiple
- `zipcode` — filter by zip code(s)
- `property_type` — filter by type(s)
- `bedrooms` — minimum bedrooms
- `bathrooms` — minimum bathrooms
- `sqft_min`, `sqft_max` — square footage range
- `min_price`, `max_price` — price range
- `search` — full text search on address/description
- `limit` (default 100, max 100), `offset` (default 0)
- `paging=true` — returns `{listings: [...], metadata: {total: N}}`

**Example — search Manhattan 2BR+ under $2M:**
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$ATLAS_API_URL/listings?neighborhood=Manhattan&bedrooms=2&max_price=2000000&paging=true"
```

**Listing fields:** id, address, full_address, apt_num, zipcode, city, state, neighborhood, property_type, current_price, original_price, bedrooms, bathrooms, sqft, year_built, list_date, days_on_market, standard_status, agents, image_urls, listing_source, listing_agency

### Exclusive Listings (Atlas's Own)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /exclusive-listings | Admin | List all exclusive listings |
| GET | /exclusive-listings/featured | Any | Featured listings only |
| GET | /exclusive-listings/active | Admin | Active + under-contract |
| GET | /exclusive-listings/by-agent/{agent_id} | Admin | By agent |
| GET | /exclusive-listings/by-status/{status} | Admin | By status |
| GET | /exclusive-listings/{listing_id} | Admin | Get one |

**Statuses:** active, coming-soon, under-contract, sold, leased, off-market

**Exclusive listing fields:** id, address, full_address, zip, price, rent_price, beds, baths, sqft, year_built, neighborhood, borough, property_type, badges, html_description, featured, status, image_url, images, open_house_date, open_house_time, agent_ids, created_at, updated_at

### Appointments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /appointments | Admin | All appointments (date filtered) |
| GET | /appointments/admin | Admin | All with full details |
| GET | /appointments/user | Any | Current user's appointments |
| GET | /appointments/{appt_id} | Any | Get specific appointment |

**Query parameters** (GET /appointments, /appointments/admin):
- `start_date` — ISO datetime, defaults to today 00:00 ET
- `end_date` — ISO datetime, optional upper bound

**Appointment fields:** id, user_id, listing_id, appointment_time, proposed_time, appointment_status, listing_details (denormalized address/price/beds/baths), agents, user_details, buyer_agent, showing_notes, feedback, created_at

**Statuses:** APPT_SCHEDULED, APPOINTMENT_CONFIRMED, AWAITING_AGENT_RESPONSE, AGENT_NEW_TIME_PROPOSAL, AGENT_CANCELS, CLIENT_CANCELS, VIEWING_COMPLETED, AGENT_NO_SHOW, CLIENT_NO_SHOW

### Listing Inquiries

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /listing-inquiries/by-listing/{listing_id} | Admin | Inquiries for exclusive listing |
| GET | /listing-inquiries/pipeline/{listing_id} | Admin | Stage counts summary |
| GET | /listing-inquiries/follow-up-queue | Admin | Inquiries needing follow-up |
| GET | /listing-inquiries/{inquiry_id} | Admin | Get specific inquiry |

**Follow-up queue parameters:**
- `agent_id` — filter by assigned agent
- `overdue_only=true` — only past follow-up date

### Quo Text Messages & Calls

Browse SMS/text conversations and phone calls from Quo (formerly OpenPhone). The default Quo phone number is **+19143713355**.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /admin/quo-sync/phone-numbers | Admin | List all Quo phone numbers (returns phoneNumberId needed for other calls) |
| GET | /admin/quo-sync/contacts | Admin | All Quo contacts with phone lookup map |
| GET | /admin/quo-sync/phone-numbers/{phoneNumberId}/conversations | Admin | List conversations for a phone number |
| GET | /admin/quo-sync/phone-numbers/{phoneNumberId}/messages | Admin | List messages for a conversation |
| GET | /admin/quo-sync/phone-numbers/{phoneNumberId}/calls | Admin | List calls for a phone number |
| GET | /admin/quo-sync/calls/{call_id} | Admin | Call details with recording, transcript, and summary |
| POST | /quo/send | Admin | Send an SMS message |

**Conversations parameters:**
- `max_results` (1-100, default 50)
- `page_token` — for pagination
- `exclude_inactive` — remove inactive conversations

**Messages parameters:**
- `participant` — **required**, the external party's phone number (E.164, e.g. `+15551234567`)
- `days_back` (1-365, default 30)
- `max_results` (1-100, default 50)
- `page_token` — for pagination

**Calls parameters:**
- `participant` — optional, filter to calls with a specific phone number
- `days_back` (1-365, default 30)
- `max_results` (1-100, default 50)
- `page_token` — for pagination

**Send message body (POST /quo/send):**
```json
{"to": "+15551234567", "body": "Message text (1-1600 chars)"}
```

**Contacts response** includes a `phoneLookup` map for resolving names:
```json
{
  "contacts": [...],
  "phoneLookup": {
    "+15551234567": {
      "contactId": "CT...",
      "firstName": "Jake",
      "lastName": "Dunsmore",
      "company": "Acme Inc",
      "displayName": "Jake Dunsmore",
      "externalId": "hubspot-id-if-linked",
      "source": "hubspot"
    }
  }
}
```

#### How to look up texts by contact name

1. **Get the phone number ID** for our default line (+19143713355):
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$ATLAS_API_URL/admin/quo-sync/phone-numbers" \
  | node -e "process.stdin.on('data',d=>{const pns=JSON.parse(d).phoneNumbers;pns.forEach(p=>console.log(p.id,p.formattedNumber))})"
```

2. **Fetch contacts and find the person by name** (case-insensitive partial match):
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$ATLAS_API_URL/admin/quo-sync/contacts" \
  | node -e "
    process.stdin.on('data',d=>{
      const {phoneLookup}=JSON.parse(d);
      const name='jake dunsmore';
      for(const [phone,c] of Object.entries(phoneLookup)){
        if(c.displayName && c.displayName.toLowerCase().includes(name.toLowerCase()))
          console.log(phone, c.displayName);
      }
    })"
```

3. **Get recent messages** with that participant:
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$ATLAS_API_URL/admin/quo-sync/phone-numbers/PN_ID_HERE/messages?participant=+15551234567&days_back=30"
```

## Common Query Patterns

### "How many active exclusive listings do we have?"
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$ATLAS_API_URL/exclusive-listings/by-status/active" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).length+' active exclusive listings'))"
```

### "What appointments do we have this week?"
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$ATLAS_API_URL/appointments/admin?start_date=$(date -u +%Y-%m-%dT00:00:00Z)&end_date=$(date -u -d '+7 days' +%Y-%m-%dT23:59:59Z)"
```

### "Find listings in Nashville under $500k with 3+ beds"
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "$ATLAS_API_URL/listings?search=Nashville&bedrooms=3&max_price=500000&paging=true"
```

### "Who are our active clients?"
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$ATLAS_API_URL/users" | node -e "
  process.stdin.on('data',d=>{
    const users=JSON.parse(d).filter(u=>u.is_active!==false && u.role_type==='CLIENT');
    users.forEach(u=>console.log(u.display_name+' ('+u.client_type+') - '+(u.mobile_phone||'no phone')));
  })"
```

### "Show inquiry pipeline for a listing"
```bash
curl -s -H "Authorization: Bearer $TOKEN" "$ATLAS_API_URL/listing-inquiries/pipeline/{listing_id}"
```

### "What's the latest text from Jake Dunsmore?"
```bash
# Step 1: Get phone number ID (cache this — it rarely changes)
PHONE_NUMBER_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$ATLAS_API_URL/admin/quo-sync/phone-numbers" \
  | node -e "process.stdin.on('data',d=>{const pn=JSON.parse(d).phoneNumbers.find(p=>p.formattedNumber&&p.formattedNumber.includes('9143713355'));if(pn)process.stdout.write(pn.id)})")

# Step 2: Find Jake's phone number from contacts
JAKE_PHONE=$(curl -s -H "Authorization: Bearer $TOKEN" "$ATLAS_API_URL/admin/quo-sync/contacts" \
  | node -e "process.stdin.on('data',d=>{const{phoneLookup}=JSON.parse(d);for(const[ph,c]of Object.entries(phoneLookup)){if(c.displayName&&c.displayName.toLowerCase().includes('jake dunsmore')){process.stdout.write(ph);break}}})")

# Step 3: Get recent messages
curl -s -H "Authorization: Bearer $TOKEN" \
  "$ATLAS_API_URL/admin/quo-sync/phone-numbers/$PHONE_NUMBER_ID/messages?participant=$JAKE_PHONE&days_back=7&max_results=10"
```

### "Send a text to Jake Dunsmore"
```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "$ATLAS_API_URL/quo/send" \
  -d '{"to": "+15551234567", "body": "Hey Jake, just following up..."}'
```

## Tips

- Always use `paging=true` when searching listings to get total counts
- Exclusive listing IDs and regular listing IDs are different — exclusive listings may have a `linked_listing_id` pointing to the MLS listing
- Appointment dates default to Eastern Time if no timezone specified
- For large result sets, use `limit` and `offset` for pagination
- The `search` parameter on /listings does full-text search across address fields
