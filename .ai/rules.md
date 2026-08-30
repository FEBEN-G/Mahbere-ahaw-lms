# Project Rules

Never use `any`.

Never disable TypeScript.

Never duplicate business logic.

Never hardcode IDs.

Never hardcode URLs.

Never hardcode roles.

Never hardcode permissions.

Every endpoint must validate input.

Every endpoint must validate authorization.

Every database change uses migrations.

Every API returns consistent responses.

Every module owns its own DTOs.

Every controller stays thin.

Business logic belongs inside services.

Database logic belongs inside repositories.

Never mix frontend logic with backend logic.

Always use dependency injection.

Always use environment variables.

Never expose secrets.

Never commit `.env` files.

Every feature must include:

- validation
- error handling
- logging
- tests
