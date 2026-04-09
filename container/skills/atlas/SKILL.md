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

### Process Inquiry (Email, SMS, Call)

Use these endpoints to analyze an email, text message, or phone call and extract structured inquiry data (contact info, listing match, HubSpot match, suggested stage). The analysis is powered by Claude on the backend. After reviewing the results, save the inquiry using the corresponding create endpoint.

#### Process Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /email-browser/emails/{email_id}/process-inquiry | Admin | Analyze an imported email as a potential listing inquiry |
| POST | /quo/messages/process-inquiry | Admin | Analyze an SMS/text message as a potential listing inquiry |
| POST | /quo/calls/process-inquiry | Admin | Analyze a phone call transcript as a potential listing inquiry |

**Email process-inquiry body:**
```json
{
  "exclusive_listing_id": "optional — pre-selected listing hint"
}
```
The `email_id` in the URL must reference an existing document in `email_messages` (imported via `run_email_import.py`).

**SMS process-inquiry body:**
```json
{
  "text": "The SMS message content",
  "from_number": "+15551234567",
  "to_numbers": ["+19143713355"],
  "timestamp": "2026-04-09T14:30:00Z",
  "quo_message_id": "optional — Quo message ID",
  "exclusive_listing_id": "optional — pre-selected listing hint",
  "contact_name": "optional — pre-resolved from Quo contacts",
  "hubspot_contact_id": "optional — pre-resolved HubSpot ID",
  "conversation_messages": [
    {"direction": "incoming", "from_number": "+15551234567", "text": "...", "timestamp": "..."},
    {"direction": "outgoing", "from_number": "+19143713355", "text": "...", "timestamp": "..."}
  ]
}
```
Required fields: `text`, `from_number`, `to_numbers`. The rest are optional but improve analysis quality. Pass `conversation_messages` to give the AI full thread context.

**Call process-inquiry body:**
```json
{
  "call_id": "quo-call-id",
  "participant_phone": "+15551234567",
  "exclusive_listing_id": "optional — pre-selected listing hint"
}
```
Required fields: `call_id`, `participant_phone`. The backend fetches the transcript from Quo automatically.

#### Analysis Response (all three endpoints return this)

```json
{
  "contact_name": "John Doe",
  "contact_email": "john@example.com",
  "contact_phone": "+15550123",
  "contact_company": "XYZ Realty",
  "is_buyer_agent": true,
  "buyer_name": "Jane Doe",
  "hubspot_contact_id": "12345",
  "hubspot_contact_name": "John Doe",
  "hubspot_match_confidence": "high",
  "exclusive_listing_id": "507f1f77bcf86cd799439011",
  "listing_address": "123 Main St, New York, NY 10001",
  "listing_match_confidence": "high",
  "listing_match_reasoning": "Email explicitly mentions address",
  "existing_inquiry_id": null,
  "existing_inquiry_stage": null,
  "existing_inquiry_contact": null,
  "source": "email",
  "source_detail": "Initial inquiry from buyer's agent",
  "notes": "Agent inquired about property on behalf of client...",
  "suggested_stage": "new_inquiry"
}
```

Key fields to check:
- `existing_inquiry_id` — if not null, an inquiry already exists for this contact/listing. Use the update endpoint instead of creating a new one.
- `listing_match_confidence` / `hubspot_match_confidence` — "high", "medium", or "low". Review carefully if not "high".
- `suggested_stage` — one of: new_inquiry, contacted, engaged, showing_scheduled, showing_completed, feedback_received, offer_pending, passed, nurture, lost

#### Save/Create Inquiry Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /listing-inquiries/from-email | Admin | Create inquiry from email analysis |
| POST | /listing-inquiries/from-sms | Admin | Create inquiry from SMS analysis |
| POST | /listing-inquiries/{inquiry_id}/update-from-message | Admin | Update existing inquiry with new message |

**Create from email body:**
```json
{
  "email_id": "the-email-id",
  "exclusive_listing_id": "listing-id-from-analysis",
  "contact_name": "John Doe",
  "contact_email": "john@example.com",
  "contact_phone": "+15550123",
  "contact_company": "XYZ Realty",
  "is_buyer_agent": true,
  "buyer_name": "Jane Doe",
  "hubspot_contact_id": "12345",
  "create_hubspot_contact": false,
  "source_detail": "Initial inquiry from buyer's agent",
  "notes": "Agent inquired about property...",
  "assigned_agent_id": "optional — agent user ID",
  "next_follow_up_date": "optional — ISO datetime"
}
```
Required: `email_id`, `exclusive_listing_id`, `contact_name`, `is_buyer_agent`, `create_hubspot_contact`.

**Create from SMS body:**
```json
{
  "quo_message_id": "quo-msg-id",
  "from_number": "+15551234567",
  "exclusive_listing_id": "listing-id-from-analysis",
  "contact_name": "John Doe",
  "contact_email": "john@example.com",
  "contact_phone": "+15551234567",
  "contact_company": "XYZ Realty",
  "is_buyer_agent": false,
  "buyer_name": null,
  "hubspot_contact_id": "12345",
  "create_hubspot_contact": false,
  "source_detail": "SMS inquiry about listing",
  "notes": "Prospect texted about...",
  "assigned_agent_id": "optional",
  "next_follow_up_date": "optional"
}
```
Required: `quo_message_id`, `from_number`, `exclusive_listing_id`, `contact_name`, `is_buyer_agent`, `create_hubspot_contact`.

**Save response:**
```json
{
  "inquiry": { "...full ListingInquiry object..." },
  "hubspot_contact_id": "12345 or null"
}
```

#### Workflow: Processing an Inquiry

**For an email:**
1. Get the email ID (user provides it, or browse emails via email-browser endpoints if available)
2. Call `POST /email-browser/emails/{email_id}/process-inquiry` with optional listing hint
3. Review the analysis response with the user — confirm contact info, listing match, and stage
4. If `existing_inquiry_id` is set, use `POST /listing-inquiries/{inquiry_id}/update-from-message` instead
5. Otherwise, call `POST /listing-inquiries/from-email` with the confirmed/edited fields
6. Report the created inquiry back to the user

**For a text message:**
1. Gather the SMS details (text content, from_number, to_numbers). Optionally look up the contact name via `/admin/quo-sync/contacts` and include conversation context.
2. Call `POST /quo/messages/process-inquiry` with the message data
3. Review the analysis response with the user — confirm contact info, listing match, and stage
4. If `existing_inquiry_id` is set, use update endpoint instead
5. Otherwise, call `POST /listing-inquiries/from-sms` with the confirmed/edited fields
6. Report the created inquiry back to the user

**For a phone call:**
1. Get the call ID and participant phone number
2. Call `POST /quo/calls/process-inquiry`
3. Review and save as above

#### Example: Process an email inquiry

```bash
# Step 1: Process the email
curl -s -X POST -H "Authorization: Bearer $ATLAS_API_TOKEN" \
  -H "Content-Type: application/json" \
  "$ATLAS_API_URL/email-browser/emails/EMAIL_ID_HERE/process-inquiry" \
  -d '{"exclusive_listing_id": null}'

# Step 2: After reviewing analysis, save the inquiry
curl -s -X POST -H "Authorization: Bearer $ATLAS_API_TOKEN" \
  -H "Content-Type: application/json" \
  "$ATLAS_API_URL/listing-inquiries/from-email" \
  -d '{
    "email_id": "EMAIL_ID_HERE",
    "exclusive_listing_id": "LISTING_ID_FROM_ANALYSIS",
    "contact_name": "John Doe",
    "contact_email": "john@example.com",
    "is_buyer_agent": false,
    "create_hubspot_contact": true,
    "notes": "Inquiry about 123 Main St"
  }'
```

#### Example: Process an SMS inquiry

```bash
# Step 1: Process the text message
curl -s -X POST -H "Authorization: Bearer $ATLAS_API_TOKEN" \
  -H "Content-Type: application/json" \
  "$ATLAS_API_URL/quo/messages/process-inquiry" \
  -d '{
    "text": "Hi, I saw your listing on 5th Ave. Is it still available?",
    "from_number": "+15551234567",
    "to_numbers": ["+19143713355"]
  }'

# Step 2: After reviewing analysis, save the inquiry
curl -s -X POST -H "Authorization: Bearer $ATLAS_API_TOKEN" \
  -H "Content-Type: application/json" \
  "$ATLAS_API_URL/listing-inquiries/from-sms" \
  -d '{
    "quo_message_id": "QUO_MSG_ID",
    "from_number": "+15551234567",
    "exclusive_listing_id": "LISTING_ID_FROM_ANALYSIS",
    "contact_name": "Jane Smith",
    "contact_phone": "+15551234567",
    "is_buyer_agent": false,
    "create_hubspot_contact": true,
    "notes": "Asked about 5th Ave listing availability"
  }'
```

## Tips

- Always use `paging=true` when searching listings to get total counts
- Exclusive listing IDs and regular listing IDs are different — exclusive listings may have a `linked_listing_id` pointing to the MLS listing
- Appointment dates default to Eastern Time if no timezone specified
- For large result sets, use `limit` and `offset` for pagination
- The `search` parameter on /listings does full-text search across address fields
