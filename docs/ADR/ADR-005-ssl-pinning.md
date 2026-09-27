# ADR-005: SSL Pinning for Network Security

**Status**: Accepted  
**Date**: 2026-09-27  
**Deciders**: Security Team

## Context

ChatApp handles sensitive user data (messages, credentials). We needed protection against:
- Man-in-the-middle (MITM) attacks
- Rogue certificate authorities
- DNS hijacking

Options: Certificate pinning, public key pinning, trust on first use (TOFU).

## Decision

We implemented **SSL Certificate Pinning** using `react-native-ssl-pinning`:
- Pin production and staging certificates
- Validate on every API and WebSocket connection
- Fail closed: reject connection if pin doesn't match
- Allow certificate updates via app updates (not runtime)

### Pinning Strategy

```typescript
const SSL_PINNING_CONFIG = {
  'api.chatapp.com': [
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
  ],
  'ws.chatapp.com': [
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
  ],
};
```

## Consequences

### Positive
- **Strong security**: Protects against MITM attacks
- **Compliance**: Meets security audit requirements
- **User trust**: Demonstrates commitment to security

### Negative
- **Certificate rotation**: Requires app update for certificate changes
- **Development friction**: Need to configure for staging/production
- **Debugging complexity**: Harder to intercept traffic

### Neutral
- Fallback to system trust store if pin fails in dev mode

## References

- [OWASP Certificate Pinning](https://cheatsheetseries.owasp.org/cheatsheets/Pinning_Cheat_Sheet.html)
- [react-native-ssl-pinning](https://github.com/ MaximRefsnes/react-native-ssl-pinning)

---

**Last Updated**: 2026-09-27  
**Review Date**: 2027-03-27
