# Jordi Moca — Product Designer Portfolio

Personal portfolio website of **Jordi Moca**, a product designer focused on complex interfaces, design systems, and scalable digital products.

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

Each project is presented as a complete design narrative including:

* Context
* Problem definition
* Research insights
* Design process
* Key decisions
* Final solution
* Product impact

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
* **CSS3** for layout, typography and theming
* **Vanilla JavaScript** for minimal interactivity
* **GitHub Pages** for deployment

No frameworks or build tools are required.

---

# Project Structure

```
portfolio/

index.html
about.html

css/
  styles.css

js/
  main.js

images/
  README.md

work/
  streaming-product-design.html
  fintech-product-design.html

insights/
  index.html
  designing-healthcare-interfaces.html
  product-design-process.html

robots.txt
sitemap.xml
.nojekyll
favicon.svg
```

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
git clone https://github.com/yourusername/portfolio.git
cd portfolio
```

Open `index.html` directly in a browser or run a simple local server.

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

1. Push changes to the `main` branch
2. GitHub Pages automatically builds and deploys the site
3. The updated site becomes available at

https://www.jordimoca.com

The `.nojekyll` file ensures the repository is served as a pure static site.

---

# Adding New Case Studies

New projects can be added inside the `work/` directory.

Example:

```
work/healthcare-dashboard-design.html
```

Recommended structure:

```
H1 Project Title

H2 Context
H2 Problem
H2 Research
H2 Design Process
H2 Key Decisions
H2 Final Solution
H2 Impact
```

After creating a new case study:

* add it to the homepage project list
* link it from `work/index.html`
* include it in `sitemap.xml`

---

# Image Guidelines

All project images should be stored in the `images/` directory.

Recommended naming format:

```
project-name-cover.png
project-name-wireframes.png
project-name-ui.png
```

Images should be optimised for the web to maintain performance.

---

# Inspiration

The portfolio design approach is inspired by modern product design teams and companies known for strong design culture, including:

* Vercel
* Linear
* Stripe

---

# Contact

If you would like to collaborate or discuss product design work:

**Website**
https://www.jordimoca.com

**LinkedIn**
(Add your LinkedIn profile)

---

© Jordi Moca
