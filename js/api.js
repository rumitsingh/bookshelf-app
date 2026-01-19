// Open Library API Integration
class OpenLibraryAPI {
    constructor() {
        this.baseURL = 'https://openlibrary.org/api/books';
        this.coverURL = 'https://covers.openlibrary.org/b/isbn';
    }

    // Fetch book by ISBN
    async fetchBook(isbn, yearRead) {
        const cleanISBN = this.cleanISBN(isbn);
        const url = `${this.baseURL}?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const key = `ISBN:${cleanISBN}`;

            if (!data[key]) {
                throw new Error('Book not found in Open Library');
            }

            const bookData = data[key];
            return this.parseBookData(bookData, cleanISBN, yearRead);
        } catch (error) {
            throw new Error(`Failed to fetch book: ${error.message}`);
        }
    }

    // Parse API response to book object
    parseBookData(data, isbn, yearRead) {
        const title = data.title || 'Untitled';
        const author = data.authors && data.authors.length > 0
            ? data.authors[0].name
            : 'Unknown Author';

        const coverURL = data.cover?.large || data.cover?.medium || data.cover?.small ||
            `${this.coverURL}/${isbn}-L.jpg`;

        // Extract publication year
        let publicationYear = null;
        if (data.publish_date) {
            const yearMatch = data.publish_date.match(/\d{4}/);
            if (yearMatch) {
                publicationYear = parseInt(yearMatch[0]);
            }
        }

        // Extract genre from subjects
        let genre = null;
        if (data.subjects && data.subjects.length > 0) {
            genre = data.subjects[0].name;
        }

        return {
            title,
            author,
            isbn,
            coverImageURL: coverURL,
            yearRead: parseInt(yearRead),
            publicationYear,
            genre,
            notes: null
        };
    }

    // Clean ISBN (remove hyphens, spaces)
    cleanISBN(isbn) {
        return isbn.replace(/[-\s]/g, '');
    }

    // Get cover URL for ISBN
    getCoverURL(isbn, size = 'L') {
        const cleanISBN = this.cleanISBN(isbn);
        return `${this.coverURL}/${cleanISBN}-${size}.jpg`;
    }
}

// URL Parser - Extract ISBN from various book URLs
class URLParser {
    static extractISBN(input) {
        const trimmedInput = input.trim();

        // Try direct ISBN first
        const directISBN = this.extractDirectISBN(trimmedInput);
        if (directISBN) return directISBN;

        // Parse as URL
        if (trimmedInput.includes('amazon')) {
            return this.extractFromAmazon(trimmedInput);
        } else if (trimmedInput.includes('goodreads')) {
            return this.extractFromGoodreads(trimmedInput);
        } else if (trimmedInput.includes('google')) {
            return this.extractFromGoogleBooks(trimmedInput);
        } else if (trimmedInput.includes('openlibrary')) {
            return this.extractFromOpenLibrary(trimmedInput);
        }

        // Last resort: try to find ISBN pattern anywhere
        return this.extractDirectISBN(trimmedInput);
    }

    static extractDirectISBN(text) {
        // ISBN-13: 978 or 979 followed by 10 digits
        const isbn13Match = text.match(/\b(97[89][\d\-\s]{10,})\b/);
        if (isbn13Match) {
            const cleaned = isbn13Match[1].replace(/[-\s]/g, '');
            if (cleaned.length === 13) return cleaned;
        }

        // ISBN-10: 9 digits followed by digit or X
        const isbn10Match = text.match(/\b(\d{9}[\dX])\b/i);
        if (isbn10Match) {
            return isbn10Match[1].toUpperCase();
        }

        // ISBN with hyphens (more flexible)
        const isbnHyphenMatch = text.match(/\b(97[89][\d\-\s]{10,}|\d[\d\-\s]{8,}[\dX])\b/i);
        if (isbnHyphenMatch) {
            const cleaned = isbnHyphenMatch[1].replace(/[-\s]/g, '').toUpperCase();
            if (cleaned.length === 10 || cleaned.length === 13) {
                return cleaned;
            }
        }

        return null;
    }

    static extractFromAmazon(url) {
        // Amazon ASIN/ISBN pattern: /dp/{ASIN} or /gp/product/{ASIN}
        const patterns = [
            /\/dp\/([A-Z0-9]{10})/i,
            /\/gp\/product\/([A-Z0-9]{10})/i,
            /\/product\/([A-Z0-9]{10})/i
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                const asin = match[1];
                // Amazon ASINs that start with digits are often ISBN-10
                if (/^\d/.test(asin)) {
                    return asin;
                }
                return asin;
            }
        }

        // Fallback to direct ISBN extraction
        return this.extractDirectISBN(url);
    }

    static extractFromGoodreads(url) {
        // Goodreads doesn't expose ISBN in URLs easily
        // Try to find ISBN in the URL parameters or text
        return this.extractDirectISBN(url);
    }

    static extractFromGoogleBooks(url) {
        // Try to find isbn parameter
        const isbnParam = url.match(/isbn=([^&]+)/);
        if (isbnParam) {
            return isbnParam[1];
        }

        // Fallback to direct extraction
        return this.extractDirectISBN(url);
    }

    static extractFromOpenLibrary(url) {
        // Open Library: /books/{identifier} or /isbn/{isbn}
        const isbnMatch = url.match(/\/isbn\/([^/]+)/);
        if (isbnMatch) {
            return isbnMatch[1].replace(/[-\s]/g, '');
        }

        return this.extractDirectISBN(url);
    }

    static isValidISBN(isbn) {
        const cleaned = isbn.replace(/[-\s]/g, '');

        // ISBN-10: 10 characters
        if (cleaned.length === 10) {
            return true;
        }

        // ISBN-13: 13 characters starting with 978 or 979
        if (cleaned.length === 13 && (cleaned.startsWith('978') || cleaned.startsWith('979'))) {
            return true;
        }

        return false;
    }
}

// Create global API instance
const openLibraryAPI = new OpenLibraryAPI();
