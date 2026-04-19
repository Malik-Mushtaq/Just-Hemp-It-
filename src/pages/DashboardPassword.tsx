import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardHero, DashboardLayout, DashboardPanel } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { changePassword } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { isDemoUser } from "@/lib/authAudience";

const ChangePasswordSchema = z
  .object({
    current_password: z.string().min(6),
    new_password: z.string().min(6).max(30),
    confirm_password: z.string().min(1),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "New password must be different from current password",
    path: ["new_password"],
  });

type ChangePasswordFormData = z.infer<typeof ChangePasswordSchema>;

const labelClassName =
  "mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-[#8c7964]";
const fieldClassName =
  "h-11 rounded-xl border-[#dcccae] bg-[#fffdf7] pr-10 text-[#473729] placeholder:text-[#9b876e] focus-visible:ring-[#6b8440]";

const DashboardPassword = () => {
  const { user } = useAuth();
  const isDemo = isDemoUser(user);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: response.msg || "Password changed successfully!",
      });
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message || "Failed to change password"
            : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (isDemo) {
      toast({
        title: "Password updated",
        description: "Demo password updated locally.",
      });
      reset();
      return;
    }

    changePasswordMutation.mutate({
      current_password: values.current_password,
      new_password: values.new_password,
    });
  });

  return (
    <DashboardLayout>
      <DashboardHero
        eyebrow="Security"
        title="Change Password"
        description="A calmer, clearer security screen that matches the updated JUST HEMP IT visual system."
      />

      <DashboardPanel className="max-w-4xl">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className={labelClassName}>Current Password</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter your current password"
                {...register("current_password")}
                className={`${fieldClassName} ${errors.current_password ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f7e69]"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClassName}>New Password</label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter your new password"
                {...register("new_password")}
                className={`${fieldClassName} ${errors.new_password ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f7e69]"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClassName}>Confirm New Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                {...register("confirm_password")}
                className={`${fieldClassName} ${errors.confirm_password ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f7e69]"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="w-full rounded-2xl bg-[#6b8440] hover:bg-[#5c7337]"
          >
            {changePasswordMutation.isPending
              ? "Updating Password..."
              : "Update Password"}
          </Button>
        </form>
      </DashboardPanel>
    </DashboardLayout>
  );
};

export default DashboardPassword;
