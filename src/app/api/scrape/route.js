import { load } from 'cheerio';
import axios from 'axios';
import { NextResponse } from 'next/server';
import { kv } from "@vercel/kv";

// Array of User-Agents for rotation
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:54.0) Gecko/20100101 Firefox/54.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1 Safari/604.5.6',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134'
];

// Function to pick a random User-Agent
function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function validateAndCleanCurrency(input) {
    // Remove commas from the input
    const cleanInput = input.replace(/,/g, '')
        .replace(/\.$/, '') // Remove trailing decimal point
        .replace(/(\..*)\./, '$1'); // Keep only the first decimal

    // Updated regex to validate the cleaned input
    const regex = /^\$[0-9]+(\.[0-9]{2})?$/;
    return regex.test(cleanInput) ? cleanInput : "None";
}

// function delay(ms) {
//     return new Promise((resolve) => setTimeout(resolve, ms));
// }

export async function POST(req) {
    try {
        const { url } = await req.json();

        // Introduce random delay (1-3 seconds)
        // await delay(Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000);

        // Get a random User-Agent for each request
        const userAgent = getRandomUserAgent();

        // Use ScraperAPI with custom User-Agent as a query parameter
        const scraperApiUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API}&url=${encodeURIComponent(url)}&keep_headers=true`;

        // Include the randomly selected User-Agent in the headers
        const response = await axios.get(scraperApiUrl, {
            headers: {
                'User-Agent': userAgent
            }
        });

        const $ = load(response.data);
        const product = {};

        // Add the original URL to the product object
        product.url = url;

        // Extract Product Title
        product.name = $('#productTitle').text().trim();

        // Extract Price from different classes
        const priceWhole = $('.a-price-whole').text().trim();
        const priceToPay = $('.priceToPay').text().trim();
        const savingsPercentage = $('.savingsPercentage').text().trim();

        product.savingsPercentage = [...new Set(savingsPercentage.match(/-?\d+%/g))][0];

        if (priceToPay) {
            product.price = validateAndCleanCurrency([...new Set(priceToPay.split(' '))][0]);
        } else {
            product.price = validateAndCleanCurrency([...new Set(priceWhole.split(' '))][0]);
        }

        // Extract Image
        product.image = $('#landingImage').attr('src');

        // Extract Description
        product.description = $('#productDescription').text().trim();

        // Extract Features
        const features = [];
        $('#feature-bullets ul li').each((i, el) => {
            const feature = $(el).text().trim();
            if (feature) {
                features.push(feature);
            }
        });
        product.features = features;

        // Extract Specifications
        const specifications = {};
        $('#productDetails_techSpec_section_1 tr').each((i, el) => {
            const key = $(el).find('th').text().trim();
            const value = $(el).find('td').text().trim();
            if (key && value) {
                specifications[key] = value;
            }
        });
        product.specifications = specifications;

        // Extract Reviews Summary
        const reviewsSummary = $('#averageCustomerReviews span').text().trim();
        product.reviewsSummary = reviewsSummary || null;

        // Extract Rating
        const ratingText = $('.a-icon-alt').first().text().trim();
        const ratingMatch = ratingText.match(/(\d+(\.\d+)?) out of 5 stars/);
        if (ratingMatch) {
            product.rating = parseFloat(ratingMatch[1]);
            product.totalReviews = [...new Set($('#acrCustomerReviewText').text().trim().match(/\d+\sratings/g))].join(' ');
        } else {
            product.rating = null;
            product.totalReviews = null;
        }

        product.updated = true

        // Store the product data in the KV store
        const kvKey = `product:${url}`; // Use the product URL as a key
        await kv.set(kvKey, product);

        return NextResponse.json({ product }, { status: 200 });
    } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json({ error: 'An error occurred while scraping the website' }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Fetch all keys that start with 'product:'
        const keys = await kv.keys('product:*');

        // Retrieve product details for each key
        const products = await Promise.all(keys.map(async (key) => {
            const product = await kv.get(key);
            return product;
        }));

        return NextResponse.json({ products }, { status: 200 });
    } catch (error) {
        console.error('Error fetching product list:', error);
        return NextResponse.json({ error: 'An error occurred while fetching the product list' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { url } = await req.json(); // Get the URL from the request body

        // Delete the product from KV store
        await kv.del(`product:${url}`); // Assuming you're storing products with a key pattern like `product:<url>`

        return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'An error occurred while deleting the product' }, { status: 500 });
    }
}

