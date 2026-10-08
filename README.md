# Jordi Moca — Senior Product Designer Portfolio

Personal portfolio website of **Jordi Moca**, a Senior Product Designer focused on complex interfaces, design systems, and scalable digital products.

**Live site:** https://www.jordimoca.com

This repository contains the source code for a fast, minimal, SEO-optimised portfolio built to present product design work through structured case studies and thoughtful design storytelling.

The project intentionally avoids heavy frameworks and build pipelines in favour of a lightweight, maintainable architecture.

---

# About

I design digital products where **clarity, structure and usability matter most**.

My work focuses on:

* complex UX interfaces
* SaaS platforms
* healthcare and fintech products
* design systems and scalable UI patterns

This portfolio showcases selected case studies demonstrating **problem framing, design thinking and product impact**.

---

# Design Philosophy

The website follows a few guiding principles:

**Clarity over decoration**
Content and design decisions should make complex products easier to understand.

**Fast by default**
A portfolio should load instantly and never rely on heavy frameworks.

**Readable storytelling**
Case studies should communicate the thinking behind design decisions, not just final screens.

**Accessible design**
Good design must work for everyone, including assistive technologies.

---

# Features

## Structured case studies

Each case study is told twice: as a comic chapter (panels, captions and speech balloons) and as a plain-text version with the same story:

* Context and role
* The brief
* Key decisions and how they were argued
* Final solution
* Outcome and lessons

This structure highlights both **design outcomes and design reasoning**.

---

## SEO-friendly architecture

The website uses a **multi-page structure** rather than a single-page application to ensure proper indexing by search engines.

Key SEO features include:

* semantic HTML structure
* descriptive URL slugs
* XML sitemap
* robots.txt configuration
* Open Graph metadata for social sharing
* structured heading hierarchy

---

## Minimal tech stack

The portfolio is intentionally built with a lightweight stack:

* **HTML5** for semantic page structure
* **CSS3** for layout, typography and theming (one stylesheet, no framework)
* **Google Fonts**: Dela Gothic One, Montserrat and Shantell Sans
* **GitHub Pages** for deployment

The only JavaScript is the redirect map in `404.html`.

No frameworks or build tools are required.

---

# Project Structure

```
index.html                      Home: cover, chapter 1 preview, about the author
work/index.html                 Case studies
work/prescription/index.html    Chapter 1 as a comic
work/prescription/text/index.html  Chapter 1 as text
about/index.html                About
404.html                        Not found page; redirects old URLs
about.html, about-me.html       Redirects to /about/

assets/css/site.css             All styles (desktop from 1024px, mobile below)
assets/img/                     Drawings and sketches (WebP) and og-image.jpg
assets/cv/                      CV in PDF

favicon.svg
CNAME
robots.txt
sitemap.xml
_redirects                      Netlify-style redirects (ignored by GitHub Pages)
```

The layout follows the Figma file «Web completa» at its two frame widths, 1440 and 390 px; in between, the layout scales fluidly.

---

# Performance

The site is optimised for strong performance and Core Web Vitals.

Optimisations include:

* minimal JavaScript
* lazy loading images
* lightweight CSS architecture
* static hosting
* reduced DOM complexity

This ensures the portfolio remains **fast and responsive across devices**.

---

# Accessibility

Accessibility is considered throughout the project.

Implemented practices include:

* semantic HTML landmarks
* descriptive alt text for images
* keyboard navigation support
* visible focus states
* ARIA attributes where appropriate

---

# Development

The project does not require a build step.

To run the site locally:

```
git clone https://github.com/jordimoca/jordimoca.git
cd jordimoca
```

Run a simple local server (links point to folders, so opening `index.html` from disk won't follow them).

Example using Python:

```
python3 -m http.server
```

Then visit:

```
http://localhost:8000
```

---

# Deployment

The site is deployed using **GitHub Pages**.

Workflow:

1. Push changes to the `master` branch
2. GitHub Pages automatically builds and deploys the site
3. The updated site becomes available at

https://www.jordimoca.com


---

# Adding New Case Studies

New chapters go inside the `work/` directory, each in its own folder with a comic and a text version:

```
work/<chapter>/index.html
work/<chapter>/text/index.html
```

After creating a new case study:

* add it to the homepage project list
* link it from `work/index.html`
* include it in `sitemap.xml`

---

# Image Guidelines

All images live in `assets/img/` as WebP, sized for 2x screens.

Naming format:

```
drawing-02-1.webp
sketch-08-modular-screen.webp
```

---

# Contact

If you would like to collaborate or discuss product design work:

**Website**
https://www.jordimoca.com

**LinkedIn**
https://www.linkedin.com/in/jordimoca/

---

© Jordi Moca
