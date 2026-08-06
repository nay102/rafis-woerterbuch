# Custom domain migration

The website is ready to use a custom domain, but no domain is activated until ownership is confirmed.

1. Purchase or choose the exact domain.
2. In `js/site-config.js`, set `customDomain` to that domain.
3. Rename `CNAME.example` to `CNAME` and replace its contents with only the domain.
4. Replace the GitHub Pages URLs in `sitemap.xml` and `robots.txt`.
5. In the domain DNS panel, add the records shown by GitHub Pages for the selected apex or `www` configuration.
6. Add the domain in the repository’s GitHub Pages settings, wait for DNS verification, then enable HTTPS.

Do not activate the `CNAME` file before the DNS records and domain ownership are ready.
