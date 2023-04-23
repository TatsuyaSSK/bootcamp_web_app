import {Post} from "@prisma/client";
import {databaseManager} from "@/db/index";
import {
  selectUserColumnsWithoutPassword,
  type UserWithoutPassword,
} from "@/models/user";

type PostData = Pick<Post, "content" | "userId">;
export type PostWithUser = Post & {user: UserWithoutPassword};

export const createPost = async (postData: PostData): Promise<Post> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.create({
    data: postData,
  });
  return post;
};

export const updatePost = async (
  postId: number,
  content: string
): Promise<Post> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.update({
    where: {
      id: postId,
    },
    data: {
      content,
    },
  });
  return post;
};

export const deletePost = async (postId: number): Promise<Post> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.delete({
    where: {
      id: postId,
    },
  });
  return post;
};

export const getPost = async (postId: number): Promise<PostWithUser | null> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.findUnique({
    where: {
      id: postId,
    },
    select: {
      id: true,
      content: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          ...selectUserColumnsWithoutPassword,
        },
      },
    },
  });
  return post;
};

export const getAllPosts = async (): Promise<PostWithUser[]> => {
  const prisma = databaseManager.getInstance();
  const post = await prisma.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      content: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          ...selectUserColumnsWithoutPassword,
        },
      },
    },
  });
  return post;
};

export const getAllRetweetedPosts = async (): Promise<any> => {
  const prisma = databaseManager.getInstance();
  const retweetPosts = await prisma.retweet.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      // retweetのcreated_at
      createdAt: true,
      user: true,
      post: {
        select: {
          id: true,
          content: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              ...selectUserColumnsWithoutPassword,
            },
          },
        },
      },
    },
  });
  const result = [];
  for (const retweetpost of retweetPosts) {
    result.push({
      "id": retweetpost["post"]["id"],
      "content": retweetpost["post"]["content"],
      "userId": retweetpost["post"]["userId"],
      "createdAt": retweetpost.createdAt,
      "updatedAt": retweetpost["post"]["updatedAt"],
      "user": retweetpost["post"]["user"],
      "retweetUserName": retweetpost["user"]["name"]
    })
  }
  console.log(result)
  return result
}

export const getAllPostsAndRetweetedPosts = async (): Promise<any> => {
  const allPosts = await getAllPosts()
  const allRetweetedPosts = await getAllRetweetedPosts()

  const allPostsAndRetweetedPosts = [];

  for (const post of allPosts) {
    allPostsAndRetweetedPosts.push({
      ...post,
      "retweetUserName": "",
      "isRetweetedPost": false,
    })
  };
  for (const post of allRetweetedPosts) {
    allPostsAndRetweetedPosts.push({
      ...post,
      "isRetweetedPost": true,
    })
  };
  allPostsAndRetweetedPosts.sort((x, y) => {
    if (x.createdAt < y.createdAt) return 1;
    if (x.createdAt > y.createdAt) return -1;
    return 0;
  })

  return allPostsAndRetweetedPosts
}

