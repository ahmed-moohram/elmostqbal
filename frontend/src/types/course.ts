export interface Course {
  id: string | number;
  _id?: string;
  title: string;
  description?: string;
  shortDescription?: string;
  longDescription?: string;
  image?: string;
  thumbnail?: string;
  coverImage?: string;
  instructor: {
    _id?: string;
    name: string;
    image?: string;
    avatar?: string;
    title?: string;
    bio?: string;
  };
  price?: number;
  discountPrice?: number;
  paymentOptions?: Array<{
    type: 'free' | 'onetime' | 'subscription';
    price: number;
    discountPrice?: number;
    currency?: string;
  }>;
  rating: number;
  studentsCount: number;
  duration?: string;
  totalDuration?: number;
  category: string;
  level: string;
  lessons?: Array<{
    id: string;
    title: string;
    duration: string | number;
    videoUrl: string;
  }>;
  sections?: Array<{
    id?: string;
    title: string;
    description?: string;
    order: number;
    lessons: Array<{
      id?: string;
      title: string;
      description?: string;
      videoUrl: string;
      duration: number;
      order: number;
      isPreview?: boolean;
      thumbnail?: string;
    }>;
  }>;
  requirements: string[];
  features: string[];
  whatYouWillLearn?: string[];
  lastUpdated?: string;
  enrolled?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
}
