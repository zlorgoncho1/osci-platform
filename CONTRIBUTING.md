# Contributing to OSCI Platform

Thank you for your interest in contributing to OSCI! This guide will help you get started.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Set up** the development environment:
   ```bash
   cp env.example .env
   # Edit .env with your local settings
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Project Structure

```
apps/
  api/          # NestJS backend (TypeScript)
  web/          # Angular frontend (TypeScript)
docker/
  keycloak/     # Keycloak realm configuration
  opa/policies/ # OPA Rego authorization policies
  postgres/     # Database initialization
```

### Code Style

- **TypeScript** for both API and Web
- Follow existing patterns in the codebase
- Use meaningful variable and function names

## Contributing Referentiels

OSCI security frameworks (referentiels) and checklists are maintained in a **separate community repository**. To contribute a new referentiel:

1. Fork the community referentiel repository (see `GITHUB_REFERENTIEL_REPO` in `env.example`)
2. Create a new folder named after the framework (e.g., `pci-dss-v4/`)
3. Add a `referentiel.json` file following the format below
4. Submit a Pull Request

### Referentiel JSON Format

Each folder must contain a single `referentiel.json` with this structure:

```json
{
  "code": "UNIQUE_CODE",
  "name": "Framework Name",
  "description": "Description of the framework",
  "version": "1.0",
  "type": "ISO | NIST | OWASP | CIS | Internal",
  "domain": "Governance | SecurityInfra | SecurityCode | ...",
  "metadata": {},
  "controls": [
    {
      "code": "CTRL-01",
      "title": "Control title",
      "description": "Optional description",
      "orderIndex": 0
    }
  ],
  "checklists": [
    {
      "title": "Checklist Title",
      "version": "1.0",
      "domain": "SecurityInfra",
      "checklistType": "Compliance | Actionable",
      "criticality": "Critical | High | Medium | Low",
      "applicability": ["Infrastructure", "Codebase"],
      "description": "Checklist description",
      "items": [
        {
          "question": "Is X configured correctly?",
          "itemType": "YesNo | Score | Evidence | AutoCheck",
          "weight": 1.0,
          "referenceType": "ISO | NIST | OWASP | CIS | Internal",
          "reference": "Reference identifier",
          "expectedEvidence": "What evidence is expected",
          "autoTaskTitle": "Task created on non-compliance",
          "controlCode": "CTRL-01"
        }
      ]
    }
  ]
}
```

**Key points:**
- The `code` must be unique across all referentiels
- `controlCode` on items links them to framework controls for compliance tracking
- `applicability` defines which object types the checklist applies to
- Items with `controlCode: null` won't be linked to any specific control

## Submitting Changes

1. **Commit** your changes with clear, descriptive messages
2. **Push** your branch to your fork
3. **Open a Pull Request** against the `main` branch
4. **Describe** your changes in the PR description:
   - What does this PR do?
   - Are there any breaking changes?

## Pull Request Guidelines

- Keep PRs focused on a single change
- Update documentation if your change affects it
- Follow the existing code style

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- For **security vulnerabilities**, see [SECURITY.md](SECURITY.md)
- Include steps to reproduce for bug reports
- Provide as much context as possible

## Licence

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENCE).
