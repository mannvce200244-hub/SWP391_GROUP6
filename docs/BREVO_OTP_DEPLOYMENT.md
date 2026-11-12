# Brevo HTTPS OTP — approved 2026-11-12

The user selected Brevo after reporting registration OTP failure on the
Vercel/Railway demo and confirming a Free/Trial/Hobby Railway plan. SMTP is
blocked on that plan. This approves a change to BR-AUTH-09's email transport:
use the existing `EmailOtpNotifier` boundary to send through Brevo HTTPS.
The account, verification, reset and rate-limit rules are unchanged.

## Backend variables

Deploy the updated backend and set these Railway variables:

```dotenv
OTP_EMAIL_ENABLED=true
OTP_EMAIL_PROVIDER=brevo
BREVO_API_KEY=<private-Brevo-API-key>
OTP_EMAIL_FROM=<verified-sender-email>
```

Do not use the angle-bracket placeholders literally. Values belong only to the
backend; never use `VITE_*` or commit keys. Local `.env` files use `NAME=value`,
not `NAME:value`. They do not automatically synchronize with Railway Variables.

1. Open Brevo → SMTP & API → **API Keys** and generate an API key. A key from the
   **SMTP** tab beginning `xsmtpsib-` is not a REST API key and is rejected.
2. Add the sending address under Brevo Senders and complete sender verification.
   `OTP_EMAIL_FROM` is a plain email address without a display-name wrapper.
3. Set the four backend variables above, then redeploy the new backend code.
   Existing `SPRING_MAIL_HOST/PORT/USERNAME` configure SMTP, not this HTTPS path.
4. Register using a mailbox you control, check Inbox/Spam and enter its OTP.
   Check Brevo transaction logs if delivery does not arrive. A `messageId` means
   provider acceptance; it does not prove inbox delivery.
5. Verify resend and password recovery as well. The former OTP must stop working
   after resend; unverified accounts must not obtain a login session.

Brevo documents that free-mail sender domains such as Gmail cannot be domain
authenticated and may be rewritten to a Brevo sending domain. Sender/account
acceptance and inbox delivery need a live check; a Gmail sender is not proof of
domain authentication. The verified sender supplied by the user is stored only
in private deployment settings. Rotate any SMTP/API key disclosed in chat.

## Behavior and compatibility

- `OTP_EMAIL_PROVIDER=brevo` selects exactly one Brevo notifier. `gmail` remains
  the default to preserve local SMTP installations. Unknown values fail startup.
- Fixed endpoint `POST https://api.brevo.com/v3/smtp/email`, `api-key` header,
  structured sender/recipient and the existing Vietnamese subject/text/HTML.
  The shared message template prevents copy drift between providers.
- Existing Spring RestClient and JDK HTTP; no new dependency or SDK. Five-second
  connection and ten-second response deadlines; no redirects or automatic
  retries. An uncertain delivery remains an error for the existing resend flow.
- Missing/invalid provider acceptance ID, HTTP errors, malformed JSON and network
  failures return a safe 503. Logs include only status or failure category, never
  keys, recipients, OTPs or provider bodies. Disabled integrations do not send.
- Selected provider config is validated at startup, including in `prod`. Brevo
  does not require Gmail SMTP credentials. Empty keys, SMTP keys and key/header
  whitespace are rejected without logging their values.
- No frontend, schema, OTP/session lifecycle or password-reset token changes.
  No changes to customer Google login. Legacy reset-link delivery still uses its
  existing optional Resend settings; maintained password recovery uses OTP.
- POS invoice email is a separate existing SMTP transport. Its migration is
  outside this OTP request; on SMTP-restricted Railway it can remain pending
  independently of successful sales.

## References and verification

- [Brevo API key authentication](https://developers.brevo.com/docs/api-key-authentication)
- [Brevo transactional email API](https://developers.brevo.com/reference/send-transac-email)
- [Brevo sender verification](https://developers.brevo.com/docs/getting-started-with-senders-and-domains)
- [Free-mail sender rewriting](https://help.brevo.com/hc/en-us/articles/16045394674066-Troubleshooting-Domain-authentication)
- [Railway outbound SMTP restrictions](https://docs.railway.com/networking/outbound-networking#email-delivery)

See `audit-assets/verification/20261112-brevo-otp.md` for automated checks and the
actual live-configuration status. Do not equate a code/test pass with live delivery.
