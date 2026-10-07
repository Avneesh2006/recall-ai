import { AskRecallPanel } from "@/components/AskRecallPanel";

export default function AskRecallPage({ searchParams }: { searchParams: { q?: string } }) {
  return <AskRecallPanel initialQuestion={searchParams.q} />;
}
