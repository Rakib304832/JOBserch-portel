import { Hero } from "@/components/sections/hero";

// Home page: renders only the hero — the header (Navbar) is already mounted
// globally by src/app/layout.tsx, so it doesn't need to be rendered here too.
export default function Home() {
  return (
    <main>
      <Hero />
    </main>
  );
}
