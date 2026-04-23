# Google Workspace CLI (gws)

Read email, create calendar events, manage Drive files, and more via the `gws` command-line tool. Authenticated credentials are pre-mounted — no setup needed.

## Quick Reference

### Calendar

```bash
# Show upcoming events
gws calendar +agenda

# Create an event
gws calendar +insert --summary "Meeting with Jake" \
  --start "2026-04-10T14:00:00" --end "2026-04-10T15:00:00" \
  --description "Discuss property at 123 Main St" \
  --attendees "jake@example.com"

# List events in a date range
gws calendar events list --params '{"calendarId":"primary","timeMin":"2026-04-08T00:00:00Z","timeMax":"2026-04-15T00:00:00Z","singleEvents":true,"orderBy":"startTime"}'
```

### Gmail

```bash
# Show unread inbox summary
gws gmail +triage

# Read a specific message
gws gmail +read --message-id "MSG_ID"

# Send an email
gws gmail +send --to "jake@example.com" --subject "Following up" --body "Hi Jake, ..."

# Reply to a message
gws gmail +reply --message-id "MSG_ID" --body "Thanks for the update"

# Search messages
gws gmail users messages list --params '{"userId":"me","q":"from:jake subject:showing","maxResults":5}'
```

### Drive

```bash
# Search for files
gws drive files list --params '{"q":"name contains '\''quarterly report'\''","pageSize":10}'

# Upload a file
gws drive +upload --file ./report.pdf --name "Q1 Report" --parent "FOLDER_ID"
```

### Sheets

```bash
# Read a range
gws sheets +read --spreadsheet-id "SHEET_ID" --range "Sheet1!A1:D10"

# Append rows
gws sheets +append --spreadsheet-id "SHEET_ID" --range "Sheet1!A1" --values '[["Name","Date","Notes"],["Jake","2026-04-10","Follow up"]]'
```

## Tips

- Use `gws <service> --help` to discover all available commands and helpers
- Helper commands (prefixed with `+`) are high-level wrappers; raw API methods are also available
- All dates/times should include timezone or use ISO 8601 format
- The `--format table` flag gives human-readable output; default is JSON
- Use `--dry-run` to validate a request without sending it
