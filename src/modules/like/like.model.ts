export interface LikeGuideInput {
  guideId: string;
  userId: string;
}

export interface LikeResponse {
  guideItem: {
    id: string;
    title: string;
    content: string;
    status: string;
    likesCount: number;
    createdAt: Date;
  };
  like: {
    id: string;
    contentType: string;
    contentId: string;
    userId: string;
  };
}

export interface UnlikeResponse {
  id: string;
  title: string;
  content: string;
  status: string;
  likesCount: number;
  createdAt: Date;
}

export interface LikesCountResponse {
  guideId: string;
  likesCount: number;
  guide: {
    id: string;
    title: string;
  };
}

export interface UserLikeCheckResponse {
  hasLiked: boolean;
  guideId: string;
  userId: string;
}

export interface GuideLiker {
  id: string;
  userId: string;
  user: {
    id: string;
    fullname: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface PaginatedLikersResponse {
  likers: GuideLiker[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserLikedGuide {
  likeId: string;
  guide: {
    id: string;
    title: string;
    content: string;
    status: string;
    likesCount: number;
    createdAt: Date;
  } | null;
}

export interface PaginatedUserLikesResponse {
  likedGuides: UserLikedGuide[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
