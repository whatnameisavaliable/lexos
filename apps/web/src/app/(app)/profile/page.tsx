import { ProfileForm } from "@/components/profile/profile-form";

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">个人中心</h1>
      <ProfileForm />
    </div>
  );
}
