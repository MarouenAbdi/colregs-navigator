import { Hero } from "../src/components/hero/Hero.js";
import { SandboxContainer } from "../src/components/sandbox/SandboxContainer.js";
import { GalleryContainer } from "../src/components/gallery/GalleryContainer.js";

export default function Home() {
  return (
    <>
      <Hero />
      <section id="sandbox">
        <SandboxContainer />
      </section>
      <section id="gallery">
        <GalleryContainer />
      </section>
    </>
  );
}
