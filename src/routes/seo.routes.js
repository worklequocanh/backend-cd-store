import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'https://frontend-cd-store.vercel.app';
    const products = await Product.find({ isActive: true }).select('_id updatedAt');
    const categories = await Category.find({ isActive: true }).select('_id updatedAt');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    const staticPages = [
      { path: '', priority: '1.0', changefreq: 'daily' },
      { path: '/shop', priority: '0.9', changefreq: 'daily' },
      { path: '/cart', priority: '0.5', changefreq: 'weekly' },
      { path: '/login', priority: '0.3', changefreq: 'monthly' },
    ];

    staticPages.forEach(page => {
      xml += `  <url>\n`;
      xml += `    <loc>${frontendUrl}${page.path}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Categories
    categories.forEach(cat => {
      xml += `  <url>\n`;
      xml += `    <loc>${frontendUrl}/shop?category=${cat._id}</loc>\n`;
      xml += `    <lastmod>${new Date(cat.updatedAt || Date.now()).toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    // Products
    products.forEach(prod => {
      xml += `  <url>\n`;
      xml += `    <loc>${frontendUrl}/product/${prod._id}</loc>\n`;
      xml += `    <lastmod>${new Date(prod.updatedAt || Date.now()).toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    return res.status(500).send('Error generating sitemap');
  }
});

router.get('/robots.txt', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://frontend-cd-store.vercel.app';
  const backendUrl = process.env.BACKEND_URL || 'https://cd-store-backend.fly.dev';
  const robots = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${backendUrl}/api/seo/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  return res.status(200).send(robots);
});

export default router;
