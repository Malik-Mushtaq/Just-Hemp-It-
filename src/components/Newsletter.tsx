import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/lib/api/newsletter";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";

const NewsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(100, "Email must be less than 100 characters")
    .email("Enter a valid email address"),
});

type NewsletterFormValues = z.infer<typeof NewsletterSchema>;

const Newsletter = () => {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterFormValues>({
    resolver: zodResolver(NewsletterSchema),
    defaultValues: {
      email: "",
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: subscribeNewsletter,
    onSuccess: (response) => {
      if (response.errors?.length) {
        toast({
          title: "Subscription failed",
          description:
            response.errors[0]?.msg || "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Subscribed",
        description:
          response.msg ||
          response.message ||
          "Subscription successful! You will now receive updates.",
      });
      reset();
    },
    onError: (error) => {
      toast({
        title: "Subscription failed",
        description:
          error instanceof ApiError
            ? error.message
            : "Unable to subscribe right now. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = handleSubmit((values) => {
    subscribeMutation.mutate({
      email: values.email.trim().toLowerCase(),
    });
  });

  return (
    <section className="py-16 bg-beige">
      <div className="container max-w-xl text-center space-y-4">
        <h2 className="text-3xl font-bold">Stay in the Loop</h2>
        <p className="text-muted-foreground">
          Subscribe for exclusive deals, new arrivals, and hemp wellness tips.
        </p>
        <form
          onSubmit={onSubmit}
          className="flex flex-col sm:flex-row gap-2 items-start"
        >
          <div className="w-full">
            <Input
              type="email"
              placeholder="Your email address"
              className="bg-background"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-left mt-1 text-xs text-destructive">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            className="rounded-full px-6 shrink-0 w-full sm:w-auto"
            disabled={subscribeMutation.isPending}
          >
            {subscribeMutation.isPending ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
