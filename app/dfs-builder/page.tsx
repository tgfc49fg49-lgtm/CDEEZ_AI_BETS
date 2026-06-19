import { DfsBuilder } from "@/components/dfs-builder";
import { PageHeader } from "@/components/page-header";

export default function DfsBuilderPage() {
  return (
    <>
      <PageHeader
        eyebrow="DFS Builder"
        title="CSV lineup optimizer"
        description="Upload a real DFS salary CSV, lock or exclude players, and let the model build a strategic lineup inside your cap."
      />
      <DfsBuilder />
    </>
  );
}
