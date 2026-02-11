# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| latest  | :white_check_mark: |

## Reporting a Vulnerability

We take the security of OSCI Platform seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do NOT open a public GitHub issue** for security vulnerabilities.
2. Use **GitHub Security Advisories** to report privately:
   - Go to the repository's **Security** tab
   - Click **"Report a vulnerability"**
   - Provide:
     - A description of the vulnerability
     - Steps to reproduce
     - Potential impact
     - Suggested fix (if any)

### What to Expect

- **Acknowledgement** within 48 hours of your report.
- **Status update** within 7 days with an assessment and expected timeline.
- **Credit** in the security advisory (unless you prefer to remain anonymous).

### Scope

The following are in scope:
- Authentication and authorization bypasses
- Injection vulnerabilities (SQL, XSS, command injection)
- Sensitive data exposure
- Misconfigurations in default deployment
- Vulnerabilities in OPA policies

### Out of Scope

- Vulnerabilities in third-party dependencies (report these upstream)
- Issues requiring physical access
- Social engineering attacks
- Denial of service attacks

## Security Best Practices for Deployment

Before deploying OSCI in production, ensure you:

1. Change **all default passwords** in `.env`
2. Enable **TLS/HTTPS** via a reverse proxy
3. Set Keycloak `sslRequired` to `"external"` or `"all"`
4. Do **not** expose MinIO console, OPA, or PostgreSQL externally
5. Configure **resource limits** in Docker Compose
6. Set up **regular backups** for database and storage volumes
7. Review and customize **OPA authorization policies** for your organization
