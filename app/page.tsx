import AppShell from "@/components/AppShell";
import centersJson from "@/data/centers.json";
import metaJson from "@/data/meta.json";
import penaltiesJson from "@/data/penalties.json";
import postsJson from "@/data/posts.json";
import type { Center, Meta, Penalty, Post } from "@/lib/types";

export default function Home() {
  return (
    <AppShell
      centers={centersJson as unknown as Center[]}
      penalties={penaltiesJson as unknown as Penalty[]}
      posts={postsJson as unknown as Post[]}
      meta={metaJson as unknown as Meta}
    />
  );
}
