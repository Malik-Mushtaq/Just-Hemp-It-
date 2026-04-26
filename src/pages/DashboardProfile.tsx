import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardHero, DashboardLayout, DashboardPanel } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { isDemoUser } from "@/lib/authAudience";
import {
  formatProfileDateForInput,
  getUserProfile,
  updateProfile,
} from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";

const UpdateProfileSchema = z.object({
  first_name: z.string().max(100).optional().or(z.literal("")),
  last_name: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z
    .enum(["male", "female", "other"], {
      errorMap: () => ({ message: "Please select a valid gender" }),
    })
    .optional(),
  street1: z.string().max(255).optional().or(z.literal("")),
  street1Nr: z.string().max(50).optional().or(z.literal("")),
  postcode: z.string().max(20).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
});

type UpdateProfileFormData = z.infer<typeof UpdateProfileSchema>;

const labelClassName =
  "mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-[#8c7964]";
const fieldClassName =
  "h-11 rounded-xl border-[#dcccae] bg-[#fffdf7] text-[#473729] placeholder:text-[#9b876e] focus-visible:ring-[#6b8440]";

const DashboardProfile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const isDemo = isDemoUser(user);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(UpdateProfileSchema),
  });

  const profileQuery = useQuery({
    queryKey: ["user", "profile"],
    queryFn: () => getUserProfile(user?.id),
    retry: 1,
    enabled: !isDemo,
  });

  const profileUser = isDemo
    ? {
        ...user,
        phone: "+1 555-123-4567",
        date_of_birth: "1992-04-18",
        gender: "male",
        street1: "123 Hemp Lane",
        street1nr: "2",
        postcode: "97201",
        city: "Portland",
        country: "United States",
      }
    : profileQuery.data?.user || user;

  useEffect(() => {
    if (profileUser) {
      reset({
        first_name: profileUser.first_name || "",
        last_name: profileUser.last_name || "",
        phone: profileUser.phone || "",
        date_of_birth: formatProfileDateForInput(profileUser.date_of_birth),
        gender:
          (profileUser.gender as "male" | "female" | "other") || undefined,
        street1: profileUser.street1 || "",
        street1Nr: profileUser.street1nr || "",
        postcode: profileUser.postcode || "",
        city: profileUser.city || "",
        country: profileUser.country || "",
      });
    }
  }, [profileUser, reset]);

  useEffect(() => {
    if (profileQuery.data?.user) {
      updateUser(profileQuery.data.user);
    }
  }, [profileQuery.data?.user, updateUser]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      updateUser(response.user);
      toast({
        title: "Success",
        description: response.message || "Profile updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message || "Failed to update profile"
            : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = handleSubmit((data) => {
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value && value !== ""),
    );

    if (Object.keys(payload).length === 0) {
      toast({
        title: "Info",
        description: "No changes to save",
      });
      return;
    }

    if (isDemo) {
      updateUser({
        ...(profileUser || user)!,
        ...payload,
        street1nr: payload.street1Nr || profileUser?.street1nr || "",
      });
      toast({
        title: "Saved",
        description: "Demo profile updated locally.",
      });
      return;
    }

    updateMutation.mutate(payload as Parameters<typeof updateProfile>[0]);
  });

  return (
    <DashboardLayout>
      <DashboardHero
        eyebrow="My Profile"
        title="Personal Information"
        description="Updated with a cleaner hierarchy, softer cards, and consistent logo-matched colors across your full account profile."
      />

      {profileQuery.isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              {profileQuery.error instanceof ApiError
                ? profileQuery.error.message
                : "Unable to load profile details right now."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => profileQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        <DashboardPanel>
          <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8c7964]">
            Personal Information
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClassName}>First Name</label>
              <Input
                placeholder="Malik"
                {...register("first_name")}
                className={`${fieldClassName} ${errors.first_name ? "border-red-500" : ""}`}
              />
            </div>
            <div>
              <label className={labelClassName}>Last Name</label>
              <Input
                placeholder="Mushtaq Ali"
                {...register("last_name")}
                className={`${fieldClassName} ${errors.last_name ? "border-red-500" : ""}`}
              />
            </div>
            <div>
              <label className={labelClassName}>Email</label>
              <Input
                type="email"
                value={profileUser?.email || ""}
                disabled
                className={`${fieldClassName} bg-[#f5f0e5] text-[#71614d]`}
              />
            </div>
            <div>
              <label className={labelClassName}>Phone</label>
              <Input
                placeholder="+1 555-123-4567"
                {...register("phone")}
                className={`${fieldClassName} ${errors.phone ? "border-red-500" : ""}`}
              />
            </div>
            <div>
              <label className={labelClassName}>Date of Birth</label>
              <Input
                type="date"
                {...register("date_of_birth")}
                className={fieldClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Gender</label>
              <select
                {...register("gender")}
                className={`w-full ${fieldClassName} px-3`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel>
          <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8c7964]">
            Address
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClassName}>Street Address</label>
              <Input
                placeholder="123 Hemp Lane"
                {...register("street1")}
                className={fieldClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Street Number</label>
              <Input
                placeholder="2"
                {...register("street1Nr")}
                className={fieldClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Postcode</label>
              <Input
                placeholder="97201"
                {...register("postcode")}
                className={fieldClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>City</label>
              <Input
                placeholder="Portland"
                {...register("city")}
                className={fieldClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Country</label>
              <Input
                placeholder="United States"
                {...register("country")}
                className={fieldClassName}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={updateMutation.isPending || profileQuery.isLoading}
            className="mt-5 w-full rounded-2xl bg-[#6b8440] px-6 hover:bg-[#5c7337] sm:w-auto"
          >
            {updateMutation.isPending
              ? "Saving..."
              : profileQuery.isLoading
                ? "Loading..."
                : "Save Changes"}
          </Button>
        </DashboardPanel>
      </form>
    </DashboardLayout>
  );
};

export default DashboardProfile;
