# Mobile Security (React Native / Expo)

## No Secrets in the JavaScript Bundle

All API keys and secrets in the JavaScript bundle are extractable — even with Hermes bytecode compilation.

- `react-native-config` values are baked into the bundle at build time. They are not secret.
- `EXPO_PUBLIC_` values are baked into the bundle at build time. They are not secret.

The only safe approach: **use a backend proxy** for all third-party API calls that require secret keys.

```typescript
// BAD: API key in the mobile app
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` }
});

// GOOD: call your own backend
const response = await fetch('https://your-api.com/ai/chat', {
  headers: { 'Authorization': `Bearer ${userSessionToken}` },
  body: JSON.stringify({ message: userInput }),
});
```

## Secure Token Storage

- **Use `expo-secure-store`** (Expo) or **`react-native-keychain`** (bare React Native) for auth tokens.
- **Never use `AsyncStorage`** — it's unencrypted plaintext on disk.

## Deep Link Security

Deep links can be triggered by any app or website:
- Validate and sanitize all parameters
- Never include sensitive data in deep link URLs
- Require user confirmation for consequential actions

## Biometric Authentication

A simple boolean success check can be hooked on rooted devices. Use **cryptographic verification**:
1. Server sends a challenge (random nonce)
2. App signs the challenge with a hardware-backed key
3. Server verifies the signature
