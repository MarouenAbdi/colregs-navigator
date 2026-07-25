import { Hero } from "../src/components/hero/Hero.js";
import { SandboxContainer } from "../src/components/sandbox/SandboxContainer.js";
import { GalleryContainer } from "../src/components/gallery/GalleryContainer.js";
import { SandboxBridgeProvider } from "../src/components/sandbox/bridge/SandboxBridgeProvider.js";

export default function Home() {
  return (
    <SandboxBridgeProvider>
      <Hero />
      <section id="sandbox">
        <SandboxContainer />
      </section>
      <section id="gallery">
        <GalleryContainer />
      </section>
    </SandboxBridgeProvider>
  );
}
