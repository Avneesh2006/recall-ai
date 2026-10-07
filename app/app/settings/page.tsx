import { AIHealthCheck } from "@/components/AIHealthCheck";
import { DataPrivacySection } from "@/components/DataPrivacySection";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-3xl text-text-primary">Settings</h1>
      <section>
        <h2 className="mb-1 font-display text-lg text-text-primary">AI</h2>
        <p className="mb-3 text-sm text-text-secondary">
          Recall uses OpenRouter to categorize saves, suggest tags, and power Ask Recall. This runs
          one tiny test request so you can see whether it&apos;s working, and why not if it
          isn&apos;t.
        </p>
        <AIHealthCheck />
      </section>
      <DataPrivacySection />
    </div>
  );
}
