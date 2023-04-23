import {User, Post} from "@prisma/client";
import {type PostWithUser} from "@/models/post";
import {databaseManager} from "@/db/index";

type UserProfileData = Partial<Pick<User, "name" | "email" | "imageName">>;
type UserData = Pick<User, "name" | "email" | "password">;

export type UserWithoutPassword = Omit<User, "password">;

export const selectUserColumnsWithoutPassword = {
  id: true,
  name: true,
  email: true,
  imageName: true,
  createdAt: true,
  updatedAt: true,
};

export const createUser = async (userData: UserData): Promise<User> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.create({
    data: {...userData, imageName: "/image/users/default_user.jpg"},
  });
  return user;
};

export const updateUserProfile = async (
  userId: number,
  userProfileData: UserProfileData
): Promise<User> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: userProfileData,
  });
  return user;
};

export const getUserWithPosts = async (
  userId: number
): Promise<
  | (UserWithoutPassword & {
      posts: PostWithUser[];
    })
  | null
> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      ...selectUserColumnsWithoutPassword,
      posts: {
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
      },
    },
  });
  if (user === null) return null;
  return user;
};

export const getUserRetweetedPosts = async (
  userId: number
): Promise<
  | (UserWithoutPassword & {
      retweets: Array<{
        createdAt: Date;
        post: PostWithUser;
      }>;
    })
  | null
> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      ...selectUserColumnsWithoutPassword,
      retweets: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          createdAt: true,
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
      },
    },
  });
  return user;
};

export const getUserWithPostsAndRetweetedPosts = async (
  userId: number
): Promise<any> => {
  const user = await getUserWithPosts(Number(userId));
  const retweetuser = await getUserRetweetedPosts(Number(userId));

  const userPosts = user?.posts;
  const userRetweetPosts = retweetuser?.retweets.map(x => x.post);

  const userPostsAnduserRetweetPosts = [];

  if (userPosts) {
    for (const post of userPosts) {
      userPostsAnduserRetweetPosts.push({
        ...post,
        isRetweetedPost: false,
        retweetUserName: "",
      });
    }
  }
  if (userRetweetPosts && retweetuser) {
    for (let i = 0; i < userRetweetPosts.length; i++) {
      userPostsAnduserRetweetPosts.push({
        id: userRetweetPosts[i]["id"],
        content: userRetweetPosts[i]["content"],
        userId: userRetweetPosts[i]["userId"],
        // created_atをpostのcreated_atではなくretweetのcreated_atに書き換える
        createdAt: retweetuser.retweets[i].createdAt,
        updatedAt: userRetweetPosts[i]["updatedAt"],
        user: userRetweetPosts[i]["user"],
        isRetweetedPost: true,
        retweetUserName: retweetuser.name,
      });
    }
  }
  userPostsAnduserRetweetPosts.sort((x, y) => {
    if (x.createdAt < y.createdAt) return 1;
    if (x.createdAt > y.createdAt) return -1;
    return 0;
  });

  return userPostsAnduserRetweetPosts;
};

export const getUserLikedPosts = async (
  userId: number
): Promise<
  | (UserWithoutPassword & {
      likes: Array<{
        post: PostWithUser;
      }>;
    })
  | null
> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      ...selectUserColumnsWithoutPassword,
      likes: {
        orderBy: {
          post: {
            createdAt: "desc",
          },
        },
        select: {
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
      },
    },
  });
  return user;
};

export const getAllUsers = async (): Promise<UserWithoutPassword[]> => {
  const prisma = databaseManager.getInstance();
  const users = await prisma.user.findMany({
    select: {
      ...selectUserColumnsWithoutPassword,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return users;
};

export const getUser = async (
  userId: number
): Promise<UserWithoutPassword | null> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      ...selectUserColumnsWithoutPassword,
    },
  });
  return user;
};

export const getUserByEmail = async (
  email: string
): Promise<UserWithoutPassword | null> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      ...selectUserColumnsWithoutPassword,
    },
  });
  return user;
};

export const getUserByEmailWithPassword = async (
  email: string
): Promise<User | null> => {
  const prisma = databaseManager.getInstance();
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  return user;
};
