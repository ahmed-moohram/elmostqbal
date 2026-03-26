import { Request, Response } from 'express';
import { Section } from '../models/Section';

export const getSections = async (req: Request, res: Response) => {
  try {
    const { courseId, isPublished } = req.query;
    const query: any = {};

    if (courseId) query.courseId = courseId;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const sections = await Section.find(query)
      .sort({ order: 1 })
      .lean();

    res.json({ sections });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sections', error });
  }
};

export const createSection = async (req: Request, res: Response) => {
  try {
    const section = new Section(req.body);
    await section.save();
    res.status(201).json({ section });
  } catch (error) {
    res.status(500).json({ message: 'Error creating section', error });
  }
};

export const updateSection = async (req: Request, res: Response) => {
  try {
    const section = await Section.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ section });
  } catch (error) {
    res.status(500).json({ message: 'Error updating section', error });
  }
};

export const deleteSection = async (req: Request, res: Response) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting section', error });
  }
};
