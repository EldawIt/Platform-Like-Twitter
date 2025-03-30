import {
  getProfileByUsername,
  getUserLikedPosts,
  getUserPosts,
  isFollowing,
} from "@/actions/profile.action";
import { notFound } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";

// 1. تعريف واضح للأنواع
type ProfileParams = {
  username: string;
};

type UserData = {
  id: string;
  name?: string | null;
  username: string;
  bio?: string | null;
};

// 2. تحسين generateMetadata مع معالجة الأخطاء
export async function generateMetadata({ params }: { params: ProfileParams }) {
  try {
    const user = await getProfileByUsername(params.username);
    
    if (!user) {
      return {
        title: "Profile Not Found",
        description: "The requested profile does not exist.",
      };
    }

    return {
      title: `${user.name || user.username}'s Profile`,
      description: user.bio || `View ${user.username}'s profile on our platform.`,
      alternates: {
        canonical: `/profile/${user.username}`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Profile",
      description: "User profile page",
    };
  }
}

// 3. تحسين الصفحة الرئيسية مع معالجة الأخطاء
export default async function ProfilePage({ params }: { params: ProfileParams }) {
  try {
    // 4. جلب البيانات بشكل متوازٍ مع التحقق من وجود المستخدم
    const user = await getProfileByUsername(params.username);
    if (!user) {
      notFound();
    }

    // 5. جلب البيانات المتوازية مع معالجة الأخطاء
    const [posts, likedPosts, isCurrentUserFollowing] = await Promise.allSettled([
      getUserPosts(user.id),
      getUserLikedPosts(user.id),
      isFollowing(user.id),
    ]);

    // 6. معالجة نتائج Promise.allSettled
    const resolvedPosts = posts.status === "fulfilled" ? posts.value : [];
    const resolvedLikedPosts = likedPosts.status === "fulfilled" ? likedPosts.value : [];
    const resolvedIsFollowing = isCurrentUserFollowing.status === "fulfilled" 
      ? isCurrentUserFollowing.value 
      : false;

    return (
      <ProfilePageClient
        user={user}
        posts={resolvedPosts}
        likedPosts={resolvedLikedPosts}
        isFollowing={resolvedIsFollowing}
      />
    );
  } catch (error) {
    console.error("Error loading profile page:", error);
    notFound();
  }
}