export type CreateGuideInput = {
  title: string;
  content: string;
};

export type UpdateGuideInput = {
  title?: string;
  content?: string;
};

export type GuideItemOutput = {
  id: string;
  title: string;
  content: string;
  status: string;
  likesCount: number;
  createdAt: Date;
};

export type LikeGuideResponse = {
  guideItem: GuideItemOutput;
  like: {
    id: string;
    contentType: string;
    userId: string;
  };
};

export type LikesCountResponse = {
  likesCount: number;
}; 