import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { SettingsForms } from "./SettingsForms";

export const dynamic = "force-dynamic";

export default async function PlatformSettings() {
  const [config, emailReady] = await Promise.all([
    prisma.platformConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    }),
    isEmailConfigured(),
  ]);

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-ink-900">Platform settings</h1>
        <p className="text-sm text-ink-500 mt-1">
          Brand and email sender details. Resend handles delivery.
        </p>
      </header>

      <SettingsForms
        initial={{
          brandName: config.brandName,
          fromName: config.fromName ?? "",
          fromEmail: config.fromEmail ?? "",
        }}
        resendConfigured={emailReady}
      />
    </div>
  );
}
