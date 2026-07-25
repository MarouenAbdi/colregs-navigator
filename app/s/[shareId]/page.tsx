import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { getCaller } from "../../../src/lib/trpc/server.js";
import { rowToVessels } from "../../../src/server/application/scenario-service.js";
import { buildScenarioBanner } from "../../../src/lib/trpc/banner.js";
import { SandboxContainer } from "../../../src/components/sandbox/SandboxContainer.js";
import { CopyLinkButton } from "../../../src/components/sandbox/control-panel/CopyLinkButton.js";
import { SandboxBridgeProvider } from "../../../src/components/sandbox/bridge/SandboxBridgeProvider.js";

export default async function SharedScenarioPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  let scenario;
  try {
    scenario = await getCaller().scenario.get({ shareId });
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const initialScenario = rowToVessels(scenario);
  const banner = buildScenarioBanner(scenario);

  return (
    <SandboxBridgeProvider>
      <SandboxContainer key={shareId} initialScenario={initialScenario} banner={banner} />
      <div className="
        mx-auto max-w-300 px-5 pb-8
        min-[900px]:px-6
      ">
        <CopyLinkButton />
      </div>
    </SandboxBridgeProvider>
  );
}
