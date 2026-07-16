# Xtrau Public Content

This repository is Xtrau's canonical, version-controlled source for public article bodies and metadata. It is platform-independent so it can supply the support center, Xtrau ID, technician tools, product guides, legal pages, and the blog.

Content is authoritative here. Operational data such as views, feedback, search analytics, and publishing telemetry may live in a database, but that database must not become a second source of truth for article bodies or metadata.

## Structure

```text
content/          Markdown articles, organized by content type
assets/images/    Local images referenced by articles
schemas/          Metadata contract
scripts/          Content validation
```

Support categories are `account`, `orders`, `payments`, `shipping`, `warranty`, `setup`, and `troubleshooting`. All paths and filenames are lowercase kebab-case with no spaces.

## Publishing states

- `draft`: editable and never publishable.
- `published`: eligible for a consuming application to publish after validation.
- `archived`: retained for history and never publishable.

Example content is always draft and excluded from production publishing. Consumers should only ingest `published` articles, and should treat an article ID as permanent even when its title, filename, or slug changes.

## Use

Install the locked dependencies and validate all content:

```sh
npm ci
npm run validate
```

Applications should ingest validated content during build/deployment or through a controlled cached service. Do not fetch raw GitHub files for every customer request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for authoring and review requirements.
