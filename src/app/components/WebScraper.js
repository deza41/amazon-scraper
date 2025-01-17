'use client'

import React, { useState, useEffect, useRef, Suspense } from "react"
import { Search, Trash2, RefreshCw, Link } from "lucide-react"
import StarRating from "./StarRating"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { ListBulletIcon } from "@radix-ui/react-icons"
import Amazon from '../../public/amazon.svg';
import Image from "next/image";
import DraggableModal from "./draggableModal"
import LoadingSpinner from "./LoadingSpinner"

export default function WebScraper() {
    const [url, setUrl] = useState("")
    const [products, setProducts] = useState([])
    const [activeProducts, setActiveProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [productToDelete, setProductToDelete] = useState(null)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [listView, setListView] = useState(false)
    const [isUrlModalOpen, setIsUrlModalOpen] = useState(false)
    const modalRef = useRef(null)

    useEffect(() => {

        async function getData() {
            try {
                setLoading(true)
                const response = await fetch('/api/scrape'); // Replace with your API endpoint
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data?.products); // Adjust based on your API response structure
                    console.log(data?.products)
                } else {
                    throw new Error('Failed to fetch products'); // Handle non-200 responses
                }
            } catch (error) {
                console.error('Error fetching data:', error); // Log the error or set an error state
                setError('An error occurred while fetching products, loading local data...'); // Set error state to display to the user
                const storedProducts = localStorage.getItem('scrapedProducts')
                if (storedProducts) {
                    setProducts(JSON.parse(storedProducts))
                }
            }
            finally {
                setLoading(false)
            }
        }
        getData()


    }, [])

    useEffect(() => {
        // Filter products based on the search term
        const filteredProducts = products?.filter(product => {
            // Assuming product has a name or description property to search
            return Object.values(product).some(value =>
                String(value).toLowerCase().includes(search.toLowerCase())
            );
        });

        setActiveProducts(filteredProducts);
    }, [products, search]); // Add search to the dependency array

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target) && !isDeleteDialogOpen) {
                closeModal()
            }
        }

        if (selectedProduct) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [selectedProduct, isDeleteDialogOpen])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const response = await fetch("/api/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            })

            if (!response.ok) {
                throw new Error("Failed to scrape the website")
            }

            const { product } = await response.json()
            debugger;

            const existingProductIndex = products.findIndex(p => p.url === product.url)

            let updatedProductsList
            if (existingProductIndex !== -1) {
                updatedProductsList = [...products]
                updatedProductsList[existingProductIndex] = { ...product }
            } else {
                updatedProductsList = [...products, { ...product }]
            }

            setProducts(updatedProductsList)
            localStorage.setItem('scrapedProducts', JSON.stringify(updatedProductsList))
            setUrl("")
        } catch (err) {
            setError("An error occurred while scraping the website")
            console.log(err)
        } finally {
            setLoading(false)
        }
    }

    const handleProductClick = async (product) => {
        const existingProductIndex = products.findIndex(p => p.url === product.url)
        if (products[existingProductIndex].updated) {
            markProductAsUpdated(product.url, false)
        }
        if (existingProductIndex !== -1) {
            let updatedProductsList = [...products]
            updatedProductsList[existingProductIndex].updated = false
            setProducts(updatedProductsList)
            localStorage.setItem('scrapedProducts', JSON.stringify(updatedProductsList))
            // Call the function to mark the product as updated in the backend
        }
        setSelectedProduct(product)
    }

    const closeModal = () => {
        setSelectedProduct(null)
    }

    const openDeleteDialog = (product) => {
        setProductToDelete(product)
        setIsDeleteDialogOpen(true)
    }

    const deleteProduct = async () => {
        if (productToDelete) {
            try {
                const response = await fetch('/api/scrape', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: productToDelete.url }), // Send the URL to delete
                });

                if (!response.ok) {
                    throw new Error('Failed to delete product');
                }

                // Update the product list after deletion
                const updatedProductsList = products.filter(product => product.url !== productToDelete.url);
                setProducts(updatedProductsList);
                localStorage.setItem('scrapedProducts', JSON.stringify(updatedProductsList));
                setIsDeleteDialogOpen(false);
                setProductToDelete(null);
                closeModal();
            } catch (err) {
                console.error('Error deleting product:', err);
                setError('An error occurred while deleting the product');
            }
        }
    };

    const markProductAsUpdated = async (url, type) => {
        try {
            const response = await fetch('/api/scrape/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, type }), // Send the URL to update
            });

            if (!response.ok) {
                throw new Error('Failed to update product status');
            }

            const data = await response.json();
            console.log(data.message); // Optional: log the response message
        } catch (err) {
            console.error('Error updating product status:', err);
            setError('An error occurred while updating the product status');
        }
    };




    const refreshProduct = async (product) => {
        setLoading(true)
        setError("")

        try {
            const response = await fetch("/api/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: product.url })
            })

            if (!response.ok) {
                throw new Error("Failed to refresh the product")
            }

            const { product: refreshedProduct } = await response.json()

            const updatedProductsList = products.map(p =>
                p.url === refreshedProduct.url ? { ...refreshedProduct, updated: true } : p
            )

            setProducts(updatedProductsList)
            localStorage.setItem('scrapedProducts', JSON.stringify(updatedProductsList))
            setSelectedProduct({ ...refreshedProduct, updated: true })

            // Call the function to mark the product as updated in the backend
            await markProductAsUpdated(refreshedProduct.url, true);

        } catch (err) {
            setError("An error occurred while refreshing the product")
            console.log(err)
        } finally {
            setLoading(false)
        }
    }

    const refreshAllProducts = async () => {
        setLoading(true);
        setError("");

        const concurrentFetches = 5; // Number of parallel fetches
        const queue = [...products];
        const refreshedProducts = [];
        const activeFetches = [];

        const fetchProduct = async (product) => {
            try {
                const response = await fetch("/api/scrape", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: product.url }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to refresh product: ${product.url}`);
                }

                const { product: refreshedProduct } = await response.json();
                return { ...refreshedProduct, updated: true };
            } catch (error) {
                console.error(`Error refreshing product ${product.url}:`, error);
                return { ...product, updated: false, error: error.message };
            }
        };

        const processQueue = async () => {
            if (queue.length === 0 && activeFetches.length === 0) {
                setProducts(refreshedProducts);
                localStorage.setItem('scrapedProducts', JSON.stringify(refreshedProducts));
                setLoading(false);
                return;
            }

            while (activeFetches.length < concurrentFetches && queue.length > 0) {
                const product = queue.shift();
                const fetchPromise = fetchProduct(product).then((result) => {
                    refreshedProducts.push(result);
                    activeFetches.splice(activeFetches.indexOf(fetchPromise), 1);
                    processQueue();
                });
                activeFetches.push(fetchPromise);
            }
        };

        try {
            await processQueue();
        } catch (err) {
            setError("An error occurred while refreshing products");
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center w-full justify-center mb-6">
                    <Image
                        src={Amazon}
                        alt={'Amazon'}
                        className="h-10 w-auto mt-3 mr-3" // Adjust height and keep width proportional
                    />
                    <h1 className="text-2xl font-bold text-gray-900">
                        Web Scraper
                    </h1>
                </div>
                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="flex items-center border-b border-gray-300 bg-white rounded-md">
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Enter a URL to scrape..."
                            required
                            disabled={loading}
                            className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
                        />
                        <div className="flex">
                            <Button type="submit" disabled={loading} className="rounded-r-none">
                                <Search className="h-4 w-4" />
                                {loading ? "Scraping..." : "Scrape"}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setIsUrlModalOpen(!isUrlModalOpen)}
                                className="rounded-r-md rounded-l-none bg-gray-700 p-1"
                            >
                                <Link className={`h-4 w-4 ${isUrlModalOpen && "text-blue-300"}`} />
                            </Button>
                        </div>
                    </div>
                </form>

                {error && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                        role="alert"
                    >
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {products.length > 0 && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                            <h2 className="text-lg leading-6 font-medium text-gray-900">
                                Scraped Products
                            </h2>
                        </div>
                        <div className={`px-4 py-5 sm:px-6 justify-between items-center flex flex-wrap gap-3`}>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                required
                                className="text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none bg-white border rounded-full border-gray-300 w-40 sm:max-w-64"
                            />
                            <div className="flex flex-wrap gap-1">
                                <Button onClick={refreshAllProducts} disabled={loading}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Refresh All
                                </Button>
                                <Button onClick={() => setListView(!listView)} >
                                    <ListBulletIcon className="h-4 w-4" />
                                </Button>
                            </div>

                        </div>

                        <div className={`border-t border-gray-200 grid grid-cols-1 ${listView ? "p-2 gap-2" : "sm:grid-cols-2 lg:grid-cols-3 p-4 gap-6"}`}>
                            <AnimatePresence>
                                <Suspense fallback={<LoadingSpinner />}>
                                    {loading ? (
                                        <div className="col-span-4"><LoadingSpinner /></div>
                                    ) : (
                                        <>
                                            {error && (
                                                <div
                                                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                                                    role="alert"
                                                >
                                                    <span className="block sm:inline">{error}</span>
                                                </div>
                                            )}

                                            {activeProducts.length > 0 ? (
                                                <>
                                                    {activeProducts?.map((product) => (
                                                        <motion.div
                                                            key={product.url}
                                                            // initial={{ opacity: 0, y: 20 }}
                                                            // animate={{ opacity: 1, y: 0 }}
                                                            // exit={{ opacity: 0, y: -20 }}
                                                            // transition={{ duration: 0.3 }}
                                                            className={`group bg-white border border-gray-200 rounded-lg shadow-md  cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg ${product.updated ? 'ring-2 ring-blue-500' : ''} ${listView ? "w-full flex p-2 gap-2" : "p-4"}`}
                                                            onClick={() => handleProductClick(product)}
                                                        >
                                                            <div className={`flex mb-4 rounded-lg ${listView ? "" : "justify-center"}`}>
                                                                {product.image ? (
                                                                    <div className={`${listView ? "h-14 w-14" : "h-48"} overflow-hidden`}>
                                                                        <img
                                                                            src={product.image}
                                                                            alt={product.name}
                                                                            className="w-full h-full object-contain transition-transform duration-300 ease-in-out transform group-hover:scale-110"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-gray-200 h-48 w-full flex items-center justify-center text-gray-500">
                                                                        No Image
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={listView ? "w-full" : ""}>
                                                                <h3 className={`text-lg font-semibold text-gray-800 mb-2 ${listView ? "w-fit line-clamp-1" : "line-clamp-2"} `}>
                                                                    {product.name}
                                                                </h3>
                                                                <div className={listView ? "flex gap-3" : ""}>
                                                                    {product.price && (
                                                                        <p className={`text-gray-700 mb-2 font-bold truncate ${listView ? "" : ""}`}>
                                                                            {listView ? "" : "Price "}
                                                                            <span className="font-medium text-gray-900">
                                                                                <span class={"text-red-500"}>{product.savingsPercentage}</span> {product.price}
                                                                            </span>
                                                                        </p>
                                                                    )}

                                                                    {product.rating && (
                                                                        <p className={`flex gap-2 text-gray-700 mb-2 font-bold ${listView ? "" : ""} `}>
                                                                            {listView ? "" : "Rating "}
                                                                            <span className="font-medium text-gray-900">
                                                                                <StarRating rating={product.rating} />
                                                                            </span>
                                                                        </p>
                                                                    )}
                                                                </div>

                                                            </div>


                                                            {product.url && (
                                                                <div className={` ${listView ? "flex flex-col w-32 justify-end items-end" : ""}`}>
                                                                    <a
                                                                        href={product.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`text-blue-600 hover:text-blue-500 w-fit h-fit ${listView ? "text-xs sm:text-sm" : ""}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        View Product
                                                                    </a>
                                                                </div>

                                                            )}

                                                            {product.updated && (
                                                                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                                                                    Updated
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="col-span-full text-center text-gray-500 py-8">
                                                    No products found.
                                                </div>
                                            )}

                                        </>
                                    )}
                                </Suspense>
                            </AnimatePresence>
                        </div>

                    </div>
                )}

                <Dialog open={selectedProduct !== null} onOpenChange={closeModal}>
                    <DialogContent className="sm:max-w-[625px] h-full sm:max-h-[95vh]" ref={modalRef}>
                        <DialogHeader>
                            <DialogTitle>{selectedProduct?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4  max-h-[80vh] overflow-auto">
                            <div className="flex justify-center mb-4">
                                {selectedProduct?.image ? (
                                    <img
                                        src={selectedProduct.image}
                                        alt={selectedProduct.name}
                                        className="w-full max-w-xs object-contain h-48"
                                    />
                                ) : (
                                    <div className="bg-gray-200 h-48 w-full flex items-center justify-center text-gray-500">
                                        No Image
                                    </div>
                                )}
                            </div>

                            {selectedProduct?.price && (
                                <p className="text-sm text-gray-700 font-bold px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    Price:{" "}
                                    <span className="font-medium text-gray-900">
                                        <span class={"text-red-500"}>{selectedProduct.savingsPercentage}</span> {selectedProduct.price}
                                    </span>
                                </p>
                            )}

                            {selectedProduct?.rating && (
                                <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-bold text-gray-500">Rating</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <StarRating rating={selectedProduct.rating} />
                                        <span className="ml-2 text-gray-600">{selectedProduct.rating} out of 5 stars ({selectedProduct.totalReviews})</span>
                                    </dd>
                                </div>
                            )}

                            {selectedProduct?.description && (
                                <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-bold text-gray-500">Description</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedProduct.description}</dd>
                                </div>
                            )}

                            {selectedProduct?.features && selectedProduct.features.length > 0 && (
                                <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-bold text-gray-500">Features</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <ul className="list-disc pl-5">
                                            {selectedProduct.features.map((feature, index) => (
                                                <li key={index}>{feature}</li>
                                            ))}
                                        </ul>
                                    </dd>
                                </div>
                            )}

                            {selectedProduct?.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                                <div className="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-bold text-gray-500">Specifications</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <ul className="list-disc pl-5">
                                            {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                                                <li key={key}>
                                                    <strong>{key}:</strong> {value}
                                                </li>
                                            ))}
                                        </ul>
                                    </dd>
                                </div>
                            )}

                            {selectedProduct?.url && (
                                <a
                                    href={selectedProduct.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-500 block mb-4"
                                >
                                    View Product on Amazon
                                </a>
                            )}
                        </div>
                        <DialogFooter>
                            <div className="flex justify-between w-full items-end">
                                <Button onClick={() => refreshProduct(selectedProduct)} disabled={loading}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Refresh
                                </Button>
                                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" onClick={() => openDeleteDialog(selectedProduct)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Product
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the product from your local storage.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={deleteProduct}>
                                                Yes, delete product
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <DraggableModal
                isOpen={isUrlModalOpen}
                onClose={() => setIsUrlModalOpen(false)}
                initialUrl={"https://www.amazon.com.au/"}
            />
        </div>
    )
}