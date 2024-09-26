import { load } from 'cheerio';
import axios from 'axios';
import { NextResponse } from 'next/server';


function validateAndCleanCurrency(input) {
    // Clean the currency string
    const cleanInput = input.replace(/\.$/, '') // Remove trailing decimal point
        .replace(/(\..*)\./, '$1'); // Keep only the first decimal

    // Check if the cleaned input is valid
    const regex = /^\$[0-9]+(\.[0-9]+)?$/;
    return regex.test(cleanInput) ? cleanInput : "None"; // Return cleaned input if valid, else null
}

export async function POST(req) {
    try {
        const { url } = await req.json();
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });
        const $ = load(response.data);

        // Extract product details
        const product = {};

        // Add the original URL to the product object
        product.url = url;

        // Extract Product Title
        product.name = $('#productTitle').text().trim();

        // Extract Price from different classes
        const priceWhole = $('.a-price-whole').text().trim();
        const priceToPay = $('.priceToPay').text().trim();
        const savingsPercentage = $('.savingsPercentage').text().trim()

        product.savingsPercentage = [...new Set(savingsPercentage.match(/-?\d+%/g))][0]

        // Determine which price to use
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
            product.totalReviews = [...new Set($('#acrCustomerReviewText').text().trim().match(/\d+\sratings/g))].join(' ');;

        } else {
            product.rating = null;
            product.totalReviews = null;
        }

        return NextResponse.json({ product }, { status: 200 });
    } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json({ error: 'An error occurred while scraping the website' }, { status: 500 });
    }
}
