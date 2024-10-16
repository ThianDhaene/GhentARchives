import {pool} from '../db.js';

//Inloggen van een gebruiker
export const getLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
            res.status(401).json({ success: false, message: 'User niet gevonden' });
            return;
        }

        if (password !== user.password) {
            res.status(401).json({ success: false, message: 'Fout passwoord' });
            return;
        }

        console.log('Login successful:', user.ID, user.email);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            userID: user.ID,
            userEmail: user.email
        });
    } catch (error) {
        console.error('Error tijdens inloggen:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
    
//Registreer een nieuwe gebruiker
export const postUsers = async (req, res) => {
    const { email, password } = req.body;
    console.log('Registering user:', email);
    console.log(password)

    try {
        const [result] = await pool.execute(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, password]
        );

        res.status(201).json({ id: result.insertId, success: true});
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Deze email is al in gebruik' });
        } else {
            console.error('Error adding user:', error);
            res.status(500).json({ message: 'Internal Server Error'+ email + password });
        }
    }
}

//Voeg een boek toe aan de bibliotheek van de gebruiker
export const addBook = async (req, res) => {
    const {
        userId,
        bookTitle,
        bookAuthor,
        bookPages,
        bookPublisher,
        bookYear,
        bookIsbn,
        bookFullTitle,
        bookLanguage,
        bookSubjects,
        bookGenres,
        bookNativeID
    } = req.body;

    try {
        const existingBookQuery = `SELECT id FROM books WHERE bookNativeID = ?`;
        const [existingBookResult] = await pool.query(existingBookQuery, [bookNativeID]);

        let bookId;
        if (existingBookResult.length > 0) {
            bookId = existingBookResult[0].id;
        } else {
            const insertBookQuery = `
                INSERT INTO books (bookTitle, bookAuthor, bookPages, bookPublisher, bookYear, bookIsbn, bookFullTitle, bookLanguage, bookSubjects, bookGenres, bookNativeID)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [insertBookResult] = await pool.query(insertBookQuery, [
                bookTitle,
                bookAuthor,
                bookPages,
                bookPublisher,
                bookYear,
                bookIsbn,
                bookFullTitle,
                bookLanguage,
                bookSubjects.join(', '),
                bookGenres.join(', '),
                bookNativeID
            ]);
            bookId = insertBookResult.insertId; 
        }

        const userBookQuery = `SELECT * FROM user_books WHERE user_id = ? AND book_id = ?`;
        const [userBookResult] = await pool.query(userBookQuery, [userId, bookId]);

        if (userBookResult.length > 0) {
            return res.status(400).json({ error: 'Boek staat al in je bibliotheek.' });
        }
        else{
            const insertUserBookQuery = `
                INSERT INTO user_books (user_id, book_id)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE user_id=user_id
            `;
            await pool.query(insertUserBookQuery, [userId, bookId]);
        }

        res.status(200).json({ message: 'Boek succesvol toegevoegd' });
    } catch (error) {
        console.error('Error bij toevoegen van boek:', error);
        res.status(500).json({ error: 'Er was een error bij het toevoegen van het boek' });
    }
}

//Verwijder een boek uit de bibliotheek van de gebruiker
export const removeBook = async (req, res) => {
    const { userId, bookNativeID } = req.body;

    try {
        const deleteQuery = `
            DELETE FROM user_books 
            WHERE user_id = ? AND book_id = (SELECT id FROM books WHERE bookNativeID = ?)
        `;
        await pool.query(deleteQuery, [userId, bookNativeID]);

        res.status(200).json({ message: 'Book succesvol verwijderd uit bibliotheek!' });
    } catch (error) {
        console.error('Error bij verwijderen boek uit bibliotheek:', error);
        res.status(500).json({ error: 'Error bij verwijderen boek uit bibliotheek.' });
    }
};

//Laden van de bibliotheek van de gebruiker
export const getUserBooks = async (req, res) => {
    const { userId } = req.params;

    try {
        const userBooksQuery = `
            SELECT books.*
            FROM books
            INNER JOIN user_books ON books.id = user_books.book_id
            WHERE user_books.user_id = ?
        `;
        const [userBooks] = await pool.query(userBooksQuery, [userId]);

        res.status(200).json(userBooks);
    } catch (error) {
        console.error('Error bij ophalen van de boeken:', error);
        console.error('Error bij ophalen van de boeken:', error);
        res.status(500).json({ error: 'Er is een fout opgetreden bij het ophalen van de boeken van de gebruiker.' });
    }
};


// Voeg een review toe aan een boek
export const addReview = async (req, res) => {  
    const { userId, bookId, rating, comment } = req.body;
    try {
        const [userExists] = await pool.query('SELECT 1 FROM users WHERE ID = ?', [userId]);
        if (userExists.length === 0) {
            return res.status(400).json({ error: 'Er is geen gebruiker ingelogd' });
        }
        const addReviewQuery = `
            INSERT INTO reviews (user_id, book_id, rating, comment)
            VALUES (?, ?, ?, ?)
        `;
        await pool.query(addReviewQuery, [userId, bookId, rating, comment]);

        res.status(200).json({ message: 'Review succesvol toegevoegd!' });
    } catch (error) {
        console.error('Error bij toevoegen revieuw:', error);
        res.status(500).json({ error: 'Er is een fout opgetreden bij het toevoegen van de review.' });
    }
};

// Haal de reviews op van een boek
export const getReviews = async (req, res) => {
    const { bookId } = req.params;

    try {
        const getReviewsQuery = `
            SELECT reviews.*, users.email FROM reviews
            JOIN users ON reviews.user_id = users.id
            WHERE book_id = ?
            ORDER BY created_at DESC
        `;
        const [reviews] = await pool.query(getReviewsQuery, [bookId]);

        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error bij ophalen van de reviews:', error);
        res.status(500).json({ error: 'Er is een fout opgetreden bij het ophalen van de reviews.' });
    }
};