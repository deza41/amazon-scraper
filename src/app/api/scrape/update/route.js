import { NextResponse } from 'next/server';
import { kv } from "@vercel/kv"; // Adjust the import based on your KV store setup

export async function POST(req) {
    try {
        const { url, type } = await req.json(); // Get the product URL from the request body
        console.log(type)
        // Retrieve the existing product from the KV store
        const existingProduct = await kv.get(`product:${url}`);

        if (!existingProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Update the updated field to true
        existingProduct.updated = type;

        // Save the updated product back to the KV store
        await kv.set(`product:${url}`, existingProduct);

        return NextResponse.json({ message: 'Product updated successfully', product: existingProduct }, { status: 200 });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'An error occurred while updating the product' }, { status: 500 });
    }
}
