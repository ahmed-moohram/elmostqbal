import { Request, Response } from 'express';
import { Book, IBook } from '../models/Book';
import { User, IUser } from '../models/User';
import mongoose from 'mongoose';

// تعريف واجهة AuthRequest لتضمين المستخدم في الطلب
interface AuthRequest extends Request {
  user?: IUser;
  currentUser?: any; // للتوافق مع middleware الأخرى
}

export const createBook = async (req: AuthRequest, res: Response) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json({ book });
  } catch (error) {
    res.status(500).json({ message: 'Error creating book', error });
  }
};

export const getBooks = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const query: any = {};

    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search as string };
    }

    const books = await Book.find(query)
      .sort({ createdAt: -1 });

    res.json({ books });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books', error });
  }
};

export const getBook = async (req: Request, res: Response) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('reviews.user', 'name');

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ book });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching book', error });
  }
};

export const updateBook = async (req: AuthRequest, res: Response) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = [
      'title',
      'author',
      'description',
      'price',
      'coverImage',
      'category',
      'fileUrl',
      'pages',
      'language',
      'publishedDate',
    ];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates' });
    }

    // استخدام طريقة آمنة للتايبسكريبت لتحديث الكتاب
    updates.forEach((update) => {
      if (update in book && allowedUpdates.includes(update)) {
        (book as Record<string, any>)[update] = req.body[update];
      }
    });

    await book.save();
    res.json({ book });
  } catch (error) {
    res.status(500).json({ message: 'Error updating book', error });
  }
};

export const deleteBook = async (req: AuthRequest, res: Response) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await book.deleteOne();
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting book', error });
  }
};

export const purchaseBook = async (req: AuthRequest, res: Response) => {
  try {
    const book = await Book.findById(req.params.id) as unknown as IBook & { _id: mongoose.Types.ObjectId };

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // الحصول على معرف المستخدم إما من user أو currentUser
    const userId = req.user?._id || req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Handle payment (would typically involve Stripe integration)
    // For now, we'll just add the book to the user's purchased books
    const user = await User.findById(userId) as unknown as IUser & { purchasedBooks: mongoose.Types.ObjectId[] };
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // تأكد من وجود مصفوفة purchasedBooks
    if (!Array.isArray(user.purchasedBooks)) {
      user.purchasedBooks = [];
    }
    
    // تحقق من أن الكتاب ليس مشترى بالفعل
    if (!user.purchasedBooks.some(id => id.toString() === book._id.toString())) {
      user.purchasedBooks.push(book._id);
      book.purchases += 1;
      await Promise.all([user.save(), book.save()]);
    }

    res.json({ message: 'Book purchased successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error purchasing book', error });
  }
};

export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const book = await Book.findById(req.params.id) as unknown as IBook & { _id: mongoose.Types.ObjectId };

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // الحصول على معرف المستخدم إما من user أو currentUser
    const userId = req.user?._id || req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // إنشاء المراجعة مع إضافة حقل createdAt
    const review = {
      user: userId as mongoose.Types.ObjectId,
      rating: Number(rating),
      comment: String(comment),
      createdAt: new Date()
    };

    // إضافة المراجعة إلى المصفوفة
    book.reviews.push(review);

    // تحديث تقييم الكتاب
    const totalRating = book.reviews.reduce((sum, review) => sum + review.rating, 0);
    book.rating = totalRating / book.reviews.length;

    await book.save();
    res.json({ message: 'Review added successfully', book });
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error });
  }
}; 