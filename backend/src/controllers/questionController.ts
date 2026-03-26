import { Request, Response } from 'express';
import { Question, Answer } from '../models/Question';
import { User } from '../models/User';
import Course from '../models/Course';

// Create a new question
export const createQuestion = async (req: Request, res: Response) => {
  try {
    const { courseId, lessonId, title, content, tags } = req.body;
    const authorId = req.user?.id;

    if (!authorId || !courseId || !title || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const question = new Question({
      courseId,
      lessonId,
      title,
      content,
      author: authorId,
      tags: tags || []
    });

    await question.save();

    // Populate author details
    await question.populate('author', 'name avatar');

    res.status(201).json({
      message: 'Question created successfully',
      data: question
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get questions for a course
export const getCourseQuestions = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const filter = req.query.filter as string || 'all';

    let query: any = { courseId };

    // Apply filters
    if (filter === 'unresolved') {
      query.isResolved = false;
    } else if (filter === 'resolved') {
      query.isResolved = true;
    }

    const questions = await Question.find(query)
      .populate('author', 'name avatar role')
      .populate('lessonId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Question.countDocuments(query);

    // Get answer counts for each question
    const questionsWithAnswerCounts = await Promise.all(
      questions.map(async (question) => {
        const answerCount = await Answer.countDocuments({ questionId: question._id });
        return {
          ...question.toObject(),
          answerCount
        };
      })
    );

    res.json({
      message: 'Questions retrieved successfully',
      data: {
        questions: questionsWithAnswerCounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting questions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get question details with answers
export const getQuestion = async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Increment view count
    await Question.findByIdAndUpdate(questionId, { $inc: { views: 1 } });

    const question = await Question.findById(questionId)
      .populate('author', 'name avatar role')
      .populate('lessonId', 'title')
      .populate('courseId', 'title');

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const answers = await Answer.find({ questionId })
      .populate('author', 'name avatar role')
      .sort({ isAccepted: -1, createdAt: 1 });

    res.json({
      message: 'Question retrieved successfully',
      data: {
        question,
        answers
      }
    });
  } catch (error) {
    console.error('Error getting question:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add answer to question
export const addAnswer = async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;
    const authorId = req.user?.id;

    if (!authorId || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const answer = new Answer({
      questionId,
      content,
      author: authorId
    });

    await answer.save();

    // Populate author details
    await answer.populate('author', 'name avatar role');

    res.status(201).json({
      message: 'Answer added successfully',
      data: answer
    });
  } catch (error) {
    console.error('Error adding answer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Accept answer (Question author only)
export const acceptAnswer = async (req: Request, res: Response) => {
  try {
    const { answerId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const answer = await Answer.findById(answerId).populate('questionId');
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user is the question author
    const question = await Question.findById(answer.questionId);
    if (!question || question.author.toString() !== userId) {
      return res.status(403).json({ message: 'Only question author can accept answers' });
    }

    // Unaccept all other answers for this question
    await Answer.updateMany(
      { questionId: answer.questionId },
      { isAccepted: false }
    );

    // Accept this answer
    answer.isAccepted = true;
    await answer.save();

    // Mark question as resolved
    question.isResolved = true;
    await question.save();

    res.json({
      message: 'Answer accepted successfully',
      data: answer
    });
  } catch (error) {
    console.error('Error accepting answer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Vote on answer
export const voteAnswer = async (req: Request, res: Response) => {
  try {
    const { answerId } = req.params;
    const { vote } = req.body; // 'up' or 'down'
    const userId = req.user?.id;

    if (!userId || !vote) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (vote !== 'up' && vote !== 'down') {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Remove existing votes from this user
    answer.upvotes = answer.upvotes.filter(id => id.toString() !== userId);
    answer.downvotes = answer.downvotes.filter(id => id.toString() !== userId);

    // Add new vote
    if (vote === 'up') {
      answer.upvotes.push(userId);
    } else {
      answer.downvotes.push(userId);
    }

    await answer.save();

    res.json({
      message: 'Vote recorded successfully',
      data: {
        upvotes: answer.upvotes.length,
        downvotes: answer.downvotes.length
      }
    });
  } catch (error) {
    console.error('Error voting on answer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Search questions
export const searchQuestions = async (req: Request, res: Response) => {
  try {
    const { q, courseId, tags } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    let query: any = {};

    if (courseId) {
      query.courseId = courseId;
    }

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const questions = await Question.find(query)
      .populate('author', 'name avatar role')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Question.countDocuments(query);

    res.json({
      message: 'Search completed successfully',
      data: {
        questions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error searching questions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's questions
export const getUserQuestions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const questions = await Question.find({ author: userId })
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    res.json({
      message: 'User questions retrieved successfully',
      data: questions
    });
  } catch (error) {
    console.error('Error getting user questions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 