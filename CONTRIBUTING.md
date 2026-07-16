# Contributing content

## Create an article

Add a lowercase kebab-case `.md` file in its type directory. Support articles belong in `content/support/<category>/`; the directory and `category` field must match. Guide, legal, and blog articles belong in their matching top-level directory. Paths cannot contain spaces.

Every article starts with YAML front matter, then a non-empty Markdown body. Use the required fields shown below.

```yaml
---
id: "550e8400-e29b-41d4-a716-446655440000"
type: "support"
title: "Article title"
slug: "orders/article-title"
description: "A concise, distinct search-result and preview description."
category: "orders"
status: "draft"
locale: "es-MX"
updatedAt: "2026-07-16"
lastReviewedAt: "2026-07-16"
owner: "support"
---
```

Production IDs should be UUIDs. They are stable identifiers, independent of the filename, title, and slug; never reuse an ID for a different article. Optional fields are `redirectFrom`, `productScope`, `tags`, `order`, and `featured`.

Slugs and redirects use lowercase URL-safe segments with no leading slash. A slug must be globally unique. When changing a published slug, retain the old slug in `redirectFrom`; each redirect must be unique and cannot equal an active slug.

## Ownership and review

Set `owner` to the function accountable for accuracy, such as `support`, `operations`, `legal`, or `marketing`. Update `updatedAt` for a meaningful article change. Update `lastReviewedAt` only after the latest factual or policy review. Published articles require both dates.

Factual, pricing, warranty, payment, shipping, and legal claims require review by their responsible owner before publication. Include that review in the pull request. Keep article bodies free of customer data and secrets.

## Images and checks

Place local images in `assets/images/` and reference them with a relative Markdown path. Do not use unstable third-party image URLs. Relative links and images must resolve to repository files.

Before committing, run:

```sh
npm run validate
```

Pull requests must explain the content change, responsible-owner review where needed, and any redirects. Validation must pass before merge.
