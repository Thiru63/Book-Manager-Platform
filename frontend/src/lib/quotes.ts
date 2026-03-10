// Literary quotes for the sidebar
export const literaryQuotes = [
    { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
    { text: "So many books, so little time.", author: "Frank Zappa" },
    { text: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero" },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "I have always imagined that Paradise will be a kind of library.", author: "Jorge Luis Borges" },
    { text: "Reading is essential for those who seek to rise above the ordinary.", author: "Jim Rohn" },
    { text: "Books are the mirrors of the soul.", author: "Virginia Woolf" },
    { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
    { text: "One must always be careful of books, and what is inside them.", author: "Cassandra Clare" },
    { text: "Books are a uniquely portable magic.", author: "Stephen King" },
    { text: "Reading gives us someplace to go when we have to stay where we are.", author: "Mason Cooley" },
    { text: "A book is a dream that you hold in your hand.", author: "Neil Gaiman" },
    { text: "We read to know we are not alone.", author: "William Nicholson" },
    { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
    { text: "The world belongs to those who read.", author: "Rick Holland" },
];

export function getRandomQuote() {
    return literaryQuotes[Math.floor(Math.random() * literaryQuotes.length)];
}

export function getDailyQuote() {
    const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return literaryQuotes[dayOfYear % literaryQuotes.length];
}
