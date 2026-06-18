import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfileEditForm } from "./ProfileEditForm";

export default async function ProfileEditPage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">My Profile</h1>
        <p className="text-sm text-ink-500 mt-1">
          Your profile is visible to other attendees in the directory.
        </p>
      </header>

      <ProfileEditForm
        initial={{
          name: user.name,
          jobTitle: user.jobTitle,
          organization: user.organization,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          faculty: user.faculty,
          studentId: user.studentId,
          phone: user.phone,
          showInDirectory: user.showInDirectory,
        }}
      />
    </div>
  );
}
